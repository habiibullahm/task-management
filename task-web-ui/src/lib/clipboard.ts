import { toast } from 'sonner';

/** Copy text to clipboard; falls back to a temporary textarea for older browsers. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export async function copyWithToast(text: string, successMessage = 'Copied to clipboard'): Promise<void> {
  const ok = await copyToClipboard(text);
  if (ok) {
    toast.success(successMessage);
  } else {
    toast.error('Could not copy — select and copy the ID manually');
  }
}
