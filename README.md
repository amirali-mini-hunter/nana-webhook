# Nana Webhook — WordPress Admin Plugin

English (first). Below is a concise README to help developers and maintainers get productive quickly.

---

## Overview

Nana Webhook is a small WordPress admin plugin that lets site admins send text and two images (dress + model) to an external webhook. The plugin includes an admin UI with image preview, drag & drop, AJAX upload with progress/cancel/retry, and a local history of submissions stored in WordPress options.

This README explains how to install, use, and develop the plugin.

## Key Features

- Admin page (Tools → Nana Webhook) with a two-column layout: form and response/history.
- Upload two separate images: dress and model, with live preview, drag & drop and remove before submit.
- AJAX-based submit with upload progress, cancel and automatic retry.
- Server-side AJAX endpoints that handle uploads, send JSON to configured webhook, and save a history (option `nana_webhook_history`).
- History viewer in the admin UI for recent submissions.

## Installation

1. Upload the plugin folder `nana-webhook` into `wp-content/plugins/`.
2. Activate the plugin from the WordPress admin Plugins page.
3. Go to the new admin page `Nana Webhook` (top-level menu) to configure the webhook URL and test.

Alternative: use the provided `nana-webhook.zip` package and install via Plugins → Add New → Upload Plugin.

## Usage (Admin)

1. Open `Nana Webhook` in WP Admin.
2. Enter the webhook URL (full URL) and optional message text.
3. Add images for `Dress` and `Model` using drag & drop or the file chooser. A preview appears with file info and a remove button.
4. Click `Send` — the plugin will upload images via AJAX, show progress, and send a JSON payload to the webhook.
5. View the webhook response in the right-side response panel. Submissions are saved to history.

### JSON payload sent to the webhook

The plugin posts a JSON body like the following:

```json
{
  "text": "Your message here",
  "images": [
    "https://your.site/wp-content/uploads/.../dress.jpg",
    "https://your.site/wp-content/uploads/.../model.jpg"
  ]
}
```

Images array contains 0–2 URLs depending on which images were uploaded.

## Developer notes

- Main files:
  - `nana-webhook.php` — main plugin file, admin page rendering, AJAX endpoints.
  - `assets/css/admin-style.css` — all admin styles.
  - `assets/js/admin-script.js` — client-side preview, AJAX submit, progress, cancel, history UI.

- AJAX endpoints (admin-only):
  - `wp_ajax_nana_webhook_ajax_send` — handles image uploads, sends the JSON to the configured webhook, saves history in `nana_webhook_history` option.
  - `wp_ajax_nana_fetch_history` — returns history (used by admin JS to render the history list).

- Options used:
  - `nana_webhook_url` — stored webhook URL
  - `nana_webhook_last_dress_image` — last dress image URL
  - `nana_webhook_last_model_image` — last model image URL
  - `nana_webhook_history` — array of recent submissions (time, text, images, response, status)

## Development workflow

- No build step is required. Edit PHP, JS, and CSS in the plugin folder.
- After edits:

```bash
cd wp-content/plugins/nana-webhook
git add .
git commit -m "Describe change"
git push
# optionally recreate zip used for distribution
cd ..
rm -f nana-webhook.zip
zip -r nana-webhook.zip nana-webhook --exclude="nana-webhook/.git/*" --exclude="nana-webhook/.git" --exclude="nana-webhook/.gitignore"
```

## Security & notes

- AJAX endpoints use a nonce localized to the admin script. Keep WordPress core up to date.
- Uploaded files are handled using WordPress media functions (`media_handle_upload`) and saved in the WP Media Library.
- The plugin currently allows image types `jpeg`, `png`, `webp` (client-side filtered, server relies on WP upload). Adjust allowed types in JS and PHP if needed.

## Quick debugging tips

- If AJAX fails, check browser console network tab and the AJAX response. The response body often contains the webhook response or WP error.
- Server-side logs: check `wp-content/debug.log` if WP_DEBUG and WP_DEBUG_LOG are enabled.

## Next improvements (where to start)

- Client-side image compression (use canvas / webp) before upload to save bandwidth.
- Add paging/filtering for history and export option.
- Add access control: API token verification and rate limiting.

---

# مستندات (فارسی)

این افزونه برای ارسال متن و دو تصویر (لباس و مدل) از پنل مدیریت وردپرس به یک وب‌هوک خارجی طراحی شده است. رابط مدیریت شامل پیش‌نمایش تصویر، درگ اند دراپ، ارسال AJAX با نمایش پیشرفت و تاریخچه محلی ارسال‌هاست.

## نصب

1. پوشه `nana-webhook` را در `wp-content/plugins/` قرار دهید.
2. از صفحه افزونه‌ها فعال کنید.
3. منوی `نانا وب‌هوک` را در پنل مدیریت باز کنید و آدرس وب‌هوک را وارد کنید.

## استفاده

1. وارد صفحه افزونه شوید.
2. URL وب‌هوک و متن را وارد کنید.
3. عکس لباس و عکس مدل را اضافه کنید؛ پیش‌نمایش نشان داده می‌شود.
4. روی `ارسال` کلیک کنید. وضعیت ارسال و پاسخ وب‌هوک در بخش کنار نمایش می‌یابد و در تاریخچه ذخیره می‌شود.

## توسعه‌دهنده

- فایل‌های مهم:
  - `nana-webhook.php` — لود صفحه، هندلرهای AJAX.
  - `assets/js/admin-script.js` — پیش‌نمایش و ارسال AJAX.
  - `assets/css/admin-style.css` — استایل پنل.

## فرمت ارسالی

```json
{
  "text": "متن شما",
  "images": ["url1","url2"]
}
```

## نکات امنیتی

- از nonce و قابلیت‌های وردپرس استفاده شده؛ برای تولید نسخهٔ عمومی API، توکن و محدودساز اضافه کنید.

---

If anything in this README is unclear or you'd like a shorter “user guide” or a separate `DEVELOPER.md`, tell me which sections to expand or shorten and I will update the file.
