import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ItemFormDialog } from "@/components/item-form-dialog";
import {
  createItem,
  prepareMediaUpload,
  uploadMediaFile,
} from "@/lib/api-client";

vi.mock("@/lib/api-client", () => ({
  createItem: vi.fn(),
  fetchMetadata: vi.fn(),
  prepareMediaUpload: vi.fn(),
  updateItem: vi.fn(),
  uploadMediaFile: vi.fn(),
}));

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onClose = vi.fn();
  const onSaved = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <ItemFormDialog
        mode="create"
        date="2026-07-20"
        isOpen
        onClose={onClose}
        onSaved={onSaved}
      />
    </QueryClientProvider>,
  );

  return { onClose, onSaved };
}

describe("ItemFormDialog media uploads", () => {
  beforeEach(() => {
    vi.mocked(prepareMediaUpload).mockResolvedValue({
      path: "2026-07/00000000-0000-4000-8000-000000000001.jpg",
      token: "signed-token",
    });
    vi.mocked(uploadMediaFile).mockResolvedValue(undefined);
    vi.mocked(createItem).mockResolvedValue(undefined as never);
  });

  it("uploads and archives an image with its note", async () => {
    const user = userEvent.setup();
    const { onClose, onSaved } = renderDialog();
    const file = new File([new Uint8Array([1, 2, 3])], "trip.jpg", {
      type: "image/jpeg",
    });

    await user.click(screen.getByRole("button", { name: "사진" }));
    await user.upload(screen.getByLabelText(/^사진 파일/), file);
    await user.type(screen.getByLabelText("메모"), "여행 기록");
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(prepareMediaUpload).toHaveBeenCalledWith({
      contentType: "image",
      fileName: "trip.jpg",
      mimeType: "image/jpeg",
      fileSize: 3,
    });
    expect(uploadMediaFile).toHaveBeenCalledWith(
      "2026-07/00000000-0000-4000-8000-000000000001.jpg",
      "signed-token",
      file,
    );
    expect(createItem).toHaveBeenCalledWith({
      contentType: "image",
      storagePath: "2026-07/00000000-0000-4000-8000-000000000001.jpg",
      fileName: "trip.jpg",
      mimeType: "image/jpeg",
      fileSize: 3,
      note: "여행 기록",
      authorName: "익명",
      entryDate: "2026-07-20",
    });
    expect(onSaved).toHaveBeenCalled();
  });
});
