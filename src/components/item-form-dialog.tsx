"use client";

import type { FormEvent } from "react";
import { useState } from "react";

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
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  function updateField<K extends keyof FormState>(name: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleFetchMetadata() {
    setMessage(null);
    setIsFetchingMetadata(true);

    try {
      const metadata = await fetchMetadata(form.url);

      if (!metadata.ok) {
        setForm((current) => ({
          ...current,
          sourceType: metadata.sourceType || detectSourceType(current.url),
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
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "미리보기를 가져오지 못했습니다.",
      );
    } finally {
      setIsFetchingMetadata(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const input = {
        url: form.url,
        title: form.title,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        siteName: form.siteName || null,
        sourceType: form.sourceType,
        note: form.note || null,
        authorName: form.authorName,
        entryDate: form.entryDate,
        password: form.password,
      };

      if (mode === "edit" && item) {
        await updateItem(item.id, input);
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
    <div className="dialog-backdrop" role="presentation">
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "edit" ? "링크 수정" : "링크 등록"}
      >
        <form onSubmit={handleSubmit}>
          <header className="dialog-header">
            <h2>{mode === "edit" ? "링크 수정" : "링크 등록"}</h2>
            <button type="button" onClick={onClose}>
              닫기
            </button>
          </header>

          {message ? <p className="status-message error">{message}</p> : null}

          <label>
            URL
            <input
              required
              type="url"
              value={form.url}
              onChange={(event) => updateField("url", event.target.value)}
            />
          </label>

          <button
            type="button"
            onClick={handleFetchMetadata}
            disabled={!form.url || isFetchingMetadata}
          >
            {isFetchingMetadata ? "가져오는 중" : "미리보기 가져오기"}
          </button>

          <label>
            제목
            <input
              required
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </label>

          <label>
            닉네임
            <input
              required
              value={form.authorName}
              onChange={(event) => updateField("authorName", event.target.value)}
            />
          </label>

          <label>
            타입
            <select
              value={form.sourceType}
              onChange={(event) =>
                updateField("sourceType", event.target.value as SourceType)
              }
            >
              <option value="youtube">유튜브</option>
              <option value="shorts">쇼츠</option>
              <option value="community">커뮤니티</option>
              <option value="other">기타</option>
            </select>
          </label>

          <label>
            기준 날짜
            <input
              required
              type="date"
              value={form.entryDate}
              onChange={(event) => updateField("entryDate", event.target.value)}
            />
          </label>

          <label>
            메모
            <textarea
              rows={3}
              value={form.note}
              onChange={(event) => updateField("note", event.target.value)}
            />
          </label>

          <label>
            공용 비밀번호
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </label>

          <footer className="dialog-actions">
            <button type="button" onClick={onClose}>
              취소
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "저장 중" : "저장"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
