<?php
/*
Plugin Name: نانا وب‌هوک حرفه‌ای
Description: ارسال عکس و متن به وب‌هوک با طراحی شیشه‌ای، تم تاریک/روشن و فونت وزیر.
Version: 2.0
Author: شما و دستیار AI
Text Domain: nana-webhook
*/

if (!defined('ABSPATH')) exit;

class NanaWebhook {

    public function __construct() {
        add_action('admin_menu', [$this, 'add_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('admin_init', [$this, 'handle_form']);
    }

    public function add_menu() {
        add_menu_page(
            'نانا وب‌هوک',
            'نانا وب‌هوک',
            'manage_options',
            'nana-webhook',
            [$this, 'render_page'],
            'dashicons-cloud',
            26
        );
    }

    public function enqueue_assets($hook) {
        if ($hook !== 'toplevel_page_nana-webhook') {
            return;
        }
        $plugin_url = plugin_dir_url(__FILE__);
        wp_enqueue_style('nana-webhook-style', $plugin_url . 'assets/css/admin-style.css', [], '3.0');
        wp_enqueue_script('nana-webhook-script', $plugin_url . 'assets/js/admin-script.js', [], '3.0', true);
    }

    public function render_page() {
        $webhook_url = get_option('nana_webhook_url', '');
        $last_dress_image = get_option('nana_webhook_last_dress_image', '');
        $last_model_image = get_option('nana_webhook_last_model_image', '');
        $last_text = get_option('nana_webhook_last_text', '');
        $last_response = get_option('nana_webhook_last_response', '');
        ?>
        <div class="wrap nana-webhook-main-wrap">
            <h1>تنظیمات نانا وب‌هوک</h1>
            <div class="nana-webhook-wrap">
                <div class="nana-webhook-card nana-webhook-form-section">
                    <h2>ارسال به وب‌هوک</h2>
                    <form method="post" enctype="multipart/form-data">
                        <?php wp_nonce_field('nana_webhook_action', 'nana_webhook_nonce'); ?>
                        <label>آدرس وب‌هوک:</label>
                        <input type="text" name="nana_webhook_url" value="<?php echo esc_attr($webhook_url); ?>" />
                        
                        <label style="margin-top: 20px;">متن پیام:</label>
                        <textarea name="nana_webhook_text" rows="3"><?php echo esc_textarea($last_text); ?></textarea>
                        
                        <label style="margin-top: 20px;">عکس لباس:</label>
                        <input type="file" name="nana_webhook_dress_image" accept="image/*" />
                        
                        <label style="margin-top: 20px;">عکس مدل:</label>
                        <input type="file" name="nana_webhook_model_image" accept="image/*" />
                        
                        <input style="margin-top: 30px;" type="submit" name="nana_webhook_submit" value="ارسال" class="button button-primary" />
                    </form>
                    
                    <?php if (!empty($last_dress_image) || !empty($last_model_image)): ?>
                        <h3 style="margin-top:30px;">آخرین عکس‌های ارسالی:</h3>
                        <div class="nana-webhook-sent-images">
                            <?php if (!empty($last_dress_image)): ?>
                                <div class="image-container">
                                    <h4>عکس لباس:</h4>
                                    <img src="<?php echo esc_url($last_dress_image); ?>" />
                                </div>
                            <?php endif; ?>
                            <?php if (!empty($last_model_image)): ?>
                                <div class="image-container">
                                    <h4>عکس مدل:</h4>
                                    <img src="<?php echo esc_url($last_model_image); ?>" />
                                </div>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                </div>
                <div class="nana-webhook-card nana-webhook-response-section">
                    <h2>پاسخ وب‌هوک</h2>
                    <div class="nana-webhook-response-content">
                        <?php echo esc_html($last_response); ?>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    public function handle_form() {
        if (isset($_POST['nana_webhook_submit']) && isset($_POST['nana_webhook_nonce']) && wp_verify_nonce($_POST['nana_webhook_nonce'], 'nana_webhook_action')) {
            
            // ذخیره آدرس وب‌هوک
            $webhook_url = esc_url_raw($_POST['nana_webhook_url']);
            update_option('nana_webhook_url', $webhook_url);

            // ذخیره متن
            $text = sanitize_textarea_field($_POST['nana_webhook_text']);
            update_option('nana_webhook_last_text', $text);

            // پردازش آپلود تصاویر
            $images = $this->handle_image_upload();

            // ارسال به وب‌هوک
            $this->send_to_webhook($webhook_url, $text, $images);
        }
    }

    private function handle_image_upload() {
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        $images = [
            'dress' => '',
            'model' => ''
        ];
        
        // آپلود عکس لباس
        if (!empty($_FILES['nana_webhook_dress_image']['name'])) {
            if ($_FILES['nana_webhook_dress_image']['error'] === UPLOAD_ERR_OK) {
                $attachment_id = media_handle_upload('nana_webhook_dress_image', 0);
                if (!is_wp_error($attachment_id)) {
                    $images['dress'] = wp_get_attachment_url($attachment_id);
                    update_option('nana_webhook_last_dress_image', $images['dress']);
                }
            }
        }
        
        // آپلود عکس مدل
        if (!empty($_FILES['nana_webhook_model_image']['name'])) {
            if ($_FILES['nana_webhook_model_image']['error'] === UPLOAD_ERR_OK) {
                $attachment_id = media_handle_upload('nana_webhook_model_image', 0);
                if (!is_wp_error($attachment_id)) {
                    $images['model'] = wp_get_attachment_url($attachment_id);
                    update_option('nana_webhook_last_model_image', $images['model']);
                }
            }
        }
        
        return $images;
    }

    private function send_to_webhook($url, $text, $images) {
        if (!$url) {
            update_option('nana_webhook_last_response', 'خطا: آدرس وب‌هوک تنظیم نشده است.');
            return;
        }

        $body = ['text' => $text, 'images' => $images];
        $response = wp_remote_post($url, [
            'body' => json_encode($body),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            $response_body = 'خطا در اتصال: ' . $response->get_error_message();
        } else {
            $response_body = wp_remote_retrieve_body($response);
        }
        update_option('nana_webhook_last_response', $response_body);
    }
}

new NanaWebhook();
