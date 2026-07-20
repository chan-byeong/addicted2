"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import { createItem, fetchMetadata, updateItem } from "@/lib/api-client";
import { getTodayKey } from "@/lib/date";
import { archiveQueryKeys } from "@/lib/query-keys";
import { detectSourceType } from "@/lib/source-type";
import type { ArchiveItem, SourceType } from "@/types/archive";

type ItemFormDialogProps = {
  mode: "create" | "edit";
  item?: ArchiveItem | null;
  date: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

type FormState = {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
  sourceType: SourceType;
  note: string;
  authorName: string;
  entryDate: string;
  password: string;
};

function createInitialForm(
  mode: ItemFormDialogProps["mode"],
  item: ArchiveItem | null | undefined,
  date: string,
): FormState {
  if (mode === "edit" && item) {
    return {
      url: item.url,
      title: item.title,
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      siteName: item.siteName || "",
      sourceType: item.sourceType,
      note: item.note || "",
      authorName: item.authorName,
      entryDate: item.entryDate,
      password: "",
    };
  }

  return {
    url: "",
    title: "",
    description: "",
    imageUrl: "",
    siteName: "",
    sourceType: "other",
    note: "",
    authorName: "",
    entryDate: date || getTodayKey(),
    password: "",
  };
}

function getFallbackTitle(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return rawUrl;
  }
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ItemFormDialog({
  mode,
  item,
  date,
  isOpen,
  onClose,
  onSaved,
}: ItemFormDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => createInitialForm(mode, item, date));
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataFailed, setMetadataFailed] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);

  if (!isOpen) {
    return null;
  }

  function updateField<K extends keyof FormState>(name: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function loadMetadata(rawUrl: string) {
    const url = rawUrl.trim();

    if (!isValidHttpUrl(url)) {
      return null;
    }

    return queryClient.fetchQuery({
      queryKey: archiveQueryKeys.metadata(url),
      queryFn: () => fetchMetadata(url),
      staleTime: 24 * 60 * 60 * 1000,
      gcTime: 7 * 24 * 60 * 60 * 1000,
    });
  }

  async function handleFetchMetadata() {
    const url = form.url.trim();

    if (!isValidHttpUrl(url)) {
      return;
    }

    setMessage(null);
    setIsFetchingMetadata(true);
    setMetadataFailed(false);
    setHasPreview(false);

    try {
      const metadata = await loadMetadata(url);

      if (!metadata?.ok) {
        setMetadataFailed(true);
        setForm((current) => ({
          ...current,
          sourceType: metadata?.sourceType || detectSourceType(current.url),
        }));
        setMessage("미리보기를 가져오지 못했습니다. 제목을 직접 입력해 주세요.");
        return;
      }

      setForm((current) => ({
        ...current,
        url: metadata.url,
        title: metadata.title || current.title,
        description: metadata.description || "",
        imageUrl: metadata.imageUrl || "",
        siteName: metadata.siteName || "",
        sourceType: metadata.sourceType,
      }));
      setHasPreview(true);
    } catch {
      setMetadataFailed(true);
      setForm((current) => ({
        ...current,
        sourceType: detectSourceType(current.url),
      }));
      setMessage("미리보기를 가져오지 못했습니다. 제목을 직접 입력해 주세요.");
    } finally {
      setIsFetchingMetadata(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const url = form.url.trim();
      let nextForm = form;

      if (isValidHttpUrl(url) && !form.title.trim()) {
        try {
          const metadata = await loadMetadata(url);

          if (metadata?.ok) {
            nextForm = {
              ...form,
              url: metadata.url,
              title: metadata.title || form.title,
              description: metadata.description || form.description,
              imageUrl: metadata.imageUrl || form.imageUrl,
              siteName: metadata.siteName || form.siteName,
              sourceType: metadata.sourceType,
            };
          } else {
            setMetadataFailed(true);
            setMessage("미리보기를 가져오지 못했습니다. 제목을 직접 입력해 주세요.");
            return;
          }
        } catch {
          setMetadataFailed(true);
          setMessage("미리보기를 가져오지 못했습니다. 제목을 직접 입력해 주세요.");
          return;
        }
      }

      const normalizedUrl = nextForm.url.trim();
      const title = nextForm.title.trim() || getFallbackTitle(normalizedUrl);

      const input = {
        url: normalizedUrl,
        title,
        description: nextForm.description.trim() || null,
        imageUrl: nextForm.imageUrl.trim() || null,
        siteName: nextForm.siteName.trim() || null,
        sourceType: nextForm.sourceType || detectSourceType(normalizedUrl),
        note: nextForm.note || null,
        authorName: nextForm.authorName.trim() || "익명",
        entryDate: nextForm.entryDate,
      };

      if (mode === "edit" && item) {
        const password =
          nextForm.password || window.prompt("공용 비밀번호를 입력하세요.")?.trim();

        if (!password) {
          setMessage("공용 비밀번호가 필요합니다.");
          return;
        }

        await updateItem(item.id, { ...input, password });
      } else {
        await createItem(input);
      }

      await onSaved();
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Content
        size="screen"
        className="dialog"
        aria-label={mode === "edit" ? "링크 수정" : "링크 등록"}
      >
        <form onSubmit={handleSubmit}>
          <header className="dialog-header">
            <Dialog.Title className="dialog-title">
              {mode === "edit" ? "링크 수정" : "링크 등록"}
            </Dialog.Title>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              닫기
            </Button>
          </header>

          {message ? <p className="status-message error">{message}</p> : null}

          <label>
            URL
            <Input
              required
              type="url"
              placeholder="https://"
              value={form.url}
              onChange={(event) => {
                updateField("url", event.target.value);
                setMetadataFailed(false);
                setHasPreview(false);
              }}
              onBlur={() => {
                void handleFetchMetadata();
              }}
            />
          </label>

          {isFetchingMetadata ? (
            <p className="status-message">미리보기를 불러오는 중입니다.</p>
          ) : null}

          {hasPreview ? (
            <div className="metadata-preview" aria-label="링크 미리보기">
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="" className="metadata-preview__thumb" />
              ) : (
                <div className="metadata-preview__glyph" aria-hidden="true" />
              )}
              <div className="metadata-preview__body">
                <strong>{form.title}</strong>
                {form.description ? <p>{form.description}</p> : null}
                <span>{form.siteName || getFallbackTitle(form.url)}</span>
              </div>
            </div>
          ) : null}

          {metadataFailed ? (
            <label>
              제목
              <Input
                required
                placeholder="링크 제목"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
              />
            </label>
          ) : null}

          <label>
            메모
            <Textarea
              placeholder="메모를 입력하세요 (선택)"
              rows={3}
              value={form.note}
              onChange={(event) => updateField("note", event.target.value)}
            />
          </label>

          <footer className="dialog-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting || isFetchingMetadata}>
              {isSubmitting ? "저장 중" : "저장"}
            </Button>
          </footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
