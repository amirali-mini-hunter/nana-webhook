document.addEventListener('DOMContentLoaded', function() {
    // تعریف متغیرهای اصلی
    const dressInput = document.querySelector('input[name="nana_webhook_dress_image"]');
    const modelInput = document.querySelector('input[name="nana_webhook_model_image"]');
    const previewContainers = {
        dress: createPreviewContainer(dressInput, 'لباس'),
        model: createPreviewContainer(modelInput, 'مدل')
    };

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
});