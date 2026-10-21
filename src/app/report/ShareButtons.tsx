"use client";

import { useState } from "react";
import styles from "./report.module.css";

type Props = { imageUrl: string; fileName: string; sharePath: string };

export function ShareButtons({ imageUrl, fileName, sharePath }: Props) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveImage() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      // 모바일: 공유 시트(사진 앱에 저장 포함), 그 외: 파일 다운로드
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("이미지를 저장했어요.");
    } catch {
      setMessage("이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    const url = new URL(sharePath, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setMessage("링크를 복사했어요.");
    } catch {
      window.prompt("아래 링크를 복사해 주세요.", url);
    }
  }

  return (
    <div className={styles.share}>
      <div className={styles.shareButtons}>
        <button type="button" className={styles.shareButton} onClick={saveImage} disabled={saving}>
          {saving ? "만드는 중…" : "이미지 저장"}
        </button>
        <button type="button" className={styles.shareButton} onClick={copyLink}>
          링크 복사
        </button>
      </div>
      <p className={styles.shareMessage} role="status">
        {message}
      </p>
    </div>
  );
}
