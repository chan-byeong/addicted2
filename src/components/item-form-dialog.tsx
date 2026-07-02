"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import { createItem, fetchMetadata, updateItem } from "@/lib/api-client";
import { getTodayKey } from "@/lib/date";
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

export function ItemFormDialog({
  mode,
  item,
  date,
  isOpen,
  onClose,
  onSaved,
}: ItemFormDialogProps) {
  const [form, setForm] = useState(() => createInitialForm(mode, item, date));
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  function updateField<K extends keyof FormState>(name: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      let metadata: Awaited<ReturnType<typeof fetchMetadata>> | null = null;

      try {
        metadata = await fetchMetadata(form.url);
      } catch {
        metadata = null;
      }

      const normalizedUrl = metadata?.url || form.url;
      const title =
        metadata?.ok && metadata.title
          ? metadata.title
          : form.title || getFallbackTitle(normalizedUrl);

      const input = {
        url: normalizedUrl,
        title,
        description:
          metadata?.ok && metadata.description
            ? metadata.description
            : form.description || null,
        imageUrl:
          metadata?.ok && metadata.imageUrl ? metadata.imageUrl : form.imageUrl || null,
        siteName:
          metadata?.ok && metadata.siteName ? metadata.siteName : form.siteName || null,
        sourceType: metadata?.sourceType || form.sourceType || detectSourceType(form.url),
        note: form.note || null,
        authorName: form.authorName || "익명",
        entryDate: form.entryDate,
      };

      if (mode === "edit" && item) {
        const password =
          form.password || window.prompt("공용 비밀번호를 입력하세요.")?.trim();

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
              onChange={(event) => updateField("url", event.target.value)}
            />
          </label>

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
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "저장 중" : "저장"}
            </Button>
          </footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
