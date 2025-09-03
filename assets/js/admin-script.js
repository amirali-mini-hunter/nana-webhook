document.addEventListener('DOMContentLoaded', function() {
    // تنظیمات پیش‌فرض
    const DEFAULT_COMPRESS_SIZE = 1200; // حداکثر عرض/ارتفاع تصویر
    const JPEG_QUALITY = 0.8; // کیفیت فشرده‌سازی
    // تعریف متغیرهای اصلی
    const dressInput = document.querySelector('input[name="nana_webhook_dress_image"]');
    const modelInput = document.querySelector('input[name="nana_webhook_model_image"]');
    const previewContainers = {
        dress: createPreviewContainer(dressInput, 'لباس'),
        model: createPreviewContainer(modelInput, 'مدل')
    };

    // عناصر فرم
    const form = document.querySelector('.nana-webhook-form-section form');
    const submitBtn = form.querySelector('input[type="submit"]');
    const responseBox = document.querySelector('.nana-webhook-response-content');
    const historyList = createHistoryUI();

    let currentXhr = null;
    let currentRetries = 0;

    // ایجاد کانتینر پیش‌نمایش
    function createPreviewContainer(input, title) {
        const container = document.createElement('div');
        container.className = 'nana-image-preview';
        container.innerHTML = `
            <div class="preview-title">${title}</div>
            <div class="preview-box">
                <div class="drop-message">تصویر را اینجا رها کنید یا کلیک کنید</div>
                <img style="display: none;">
                <div class="file-info"></div>
                <button type="button" class="remove-image" style="display: none;">حذف</button>
            </div>
        `;
        input.parentNode.insertBefore(container, input.nextSibling);
        
        setupPreviewEvents(container, input);
        return container;
    }

    // تنظیم رویدادها
    function setupPreviewEvents(container, input) {
        const previewBox = container.querySelector('.preview-box');
        const img = container.querySelector('img');
        const removeBtn = container.querySelector('.remove-image');
        const fileInfo = container.querySelector('.file-info');

        // Drag & Drop
        previewBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            previewBox.classList.add('dragging');
        });

        previewBox.addEventListener('dragleave', () => {
            previewBox.classList.remove('dragging');
        });

        previewBox.addEventListener('drop', (e) => {
            e.preventDefault();
            previewBox.classList.remove('dragging');
            const files = e.dataTransfer.files;
            if (files.length) {
                input.files = files;
                handleFileSelect(files[0]);
            }
        });

        // کلیک برای انتخاب فایل
        previewBox.addEventListener('click', () => {
            if (!img.src) {
                input.click();
            }
        });

        // حذف تصویر
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearPreview();
            input.value = '';
        });

        // انتخاب فایل
        input.addEventListener('change', () => {
            if (input.files.length) {
                handleFileSelect(input.files[0]);
            }
        });

        // نمایش تصویر
        function handleFileSelect(file) {
            if (!file.type.startsWith('image/')) {
                alert('لطفاً یک تصویر انتخاب کنید');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
                img.style.display = 'block';
                removeBtn.style.display = 'block';
                
                // نمایش اطلاعات فایل
                const size = (file.size / 1024 / 1024).toFixed(2);
                fileInfo.textContent = `${file.name} (${size} MB)`;
                
                // بررسی سایز تصویر
                const tempImg = new Image();
                tempImg.src = e.target.result;
                tempImg.onload = () => {
                    fileInfo.textContent += ` - ${tempImg.width}×${tempImg.height}`;
                    if (file.size > 2 * 1024 * 1024) {
                        fileInfo.innerHTML += '<br><span class="warning">⚠️ حجم تصویر زیاد است</span>';
                    }
                };
            };
            reader.readAsDataURL(file);
        }

        // پاک کردن پیش‌نمایش
        function clearPreview() {
            img.src = '';
            img.style.display = 'none';
            removeBtn.style.display = 'none';
            fileInfo.textContent = '';
        }
    }

    // Create history UI container and populate
    function createHistoryUI() {
        const wrap = document.querySelector('.nana-webhook-wrap');
        const historyCard = document.createElement('div');
        historyCard.className = 'nana-webhook-card nana-webhook-history-section';
        historyCard.innerHTML = `
            <h2>تاریخچه ارسال‌ها</h2>
            <div class="nana-history-controls">
                <input type="date" class="history-filter-date" />
                <button class="history-refresh">بارگذاری</button>
            </div>
            <div class="nana-history-list"></div>
        `;
        wrap.appendChild(historyCard);

        const refreshBtn = historyCard.querySelector('.history-refresh');
        refreshBtn.addEventListener('click', fetchHistory);
        fetchHistory();
        return historyCard.querySelector('.nana-history-list');
    }

    // Fetch history from server by reading option via AJAX
    function fetchHistory() {
        // We will request a small admin-ajax endpoint to return history option
        const data = new FormData();
        data.append('action', 'nana_fetch_history');
        data.append('_ajax_nonce', NanaWebhookSettings.nonce);
        // Use fetch for simplicity
        fetch(NanaWebhookSettings.ajax_url, { method: 'POST', body: data })
            .then(r => r.json())
            .then(json => {
                if (json.success && json.data.history) {
                    renderHistory(json.data.history);
                }
            })
            .catch(err => console.error(err));
    }

    function renderHistory(items) {
        const list = document.querySelector('.nana-history-list');
        list.innerHTML = '';
        if (!items.length) {
            list.innerHTML = '<div class="history-empty">بدون تاریخچه</div>';
            return;
        }
        items.forEach(entry => {
            const el = document.createElement('div');
            el.className = 'nana-history-entry';
            el.innerHTML = `
                <div class="h-time">${entry.time}</div>
                <div class="h-text">${entry.text}</div>
                <div class="h-images">${entry.images.dress ? '<img src="'+entry.images.dress+'">' : ''}${entry.images.model ? '<img src="'+entry.images.model+'">' : ''}</div>
                <div class="h-response">${entry.response}</div>
            `;
            list.appendChild(el);
        });
    }

    // Submit via AJAX with progress, cancel, retry
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitViaAjax();
    });

    function submitViaAjax() {
        const url = NanaWebhookSettings.ajax_url;
        const fd = new FormData();
        fd.append('action', 'nana_webhook_ajax_send');
        fd.append('_ajax_nonce', NanaWebhookSettings.nonce);

        const webhookField = form.querySelector('input[name="nana_webhook_url"]');
        const textField = form.querySelector('textarea[name="nana_webhook_text"]');
        if (webhookField && webhookField.value) fd.append('nana_webhook_url', webhookField.value);
        if (textField) fd.append('nana_webhook_text', textField.value);

        if (dressInput.files[0]) fd.append('nana_webhook_dress_image', dressInput.files[0]);
        if (modelInput.files[0]) fd.append('nana_webhook_model_image', modelInput.files[0]);

        submitBtn.disabled = true;
        submitBtn.value = 'در حال ارسال...';

        currentRetries = 0;
        doSend(fd);
    }

    function doSend(fd) {
        const xhr = new XMLHttpRequest();
        currentXhr = xhr;
        xhr.open('POST', NanaWebhookSettings.ajax_url, true);

        // progress
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                responseBox.textContent = `آپلود ${pct}%`;
            }
        });

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                submitBtn.disabled = false;
                submitBtn.value = 'ارسال';
                currentXhr = null;
                try {
                    const json = JSON.parse(xhr.responseText);
                    if (json.success) {
                        responseBox.textContent = json.data.response || 'ارسال موفق';
                        fetchHistory();
                    } else {
                        responseBox.textContent = json.data && json.data.response ? json.data.response : 'خطا در ارسال';
                        // retry logic
                        if (currentRetries < NanaWebhookSettings.maxRetries) {
                            currentRetries++;
                            responseBox.textContent += ' - در حال تلاش مجدد ('+currentRetries+')';
                            setTimeout(() => doSend(fd), 1000);
                        }
                    }
                } catch (err) {
                    responseBox.textContent = 'پاسخ نامعتبر از سرور';
                }
            }
        };

        xhr.send(fd);
    }

    // Cancel current request
    function cancelRequest() {
        if (currentXhr) {
            currentXhr.abort();
            currentXhr = null;
            responseBox.textContent = 'درخواست لغو شد';
            submitBtn.disabled = false;
            submitBtn.value = 'ارسال';
        }
    }

    // provide a cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'nana-cancel-btn';
    cancelBtn.textContent = 'لغو';
    submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
    cancelBtn.addEventListener('click', cancelRequest);
});