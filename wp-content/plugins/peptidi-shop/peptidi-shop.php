<?php
/**
 * Plugin Name: Peptidi Shop API
 * Description: REST API for peptides online shop
 * Version: 1.0.0
 */

add_action('rest_api_init', function() {
    register_rest_route('peptidi/v1', '/products', array(
        'methods' => 'GET',
        'callback' => 'peptidi_get_products',
    ));
    
    register_rest_route('peptidi/v1', '/products', array(
        'methods' => 'POST',
        'callback' => 'peptidi_create_product',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        }
    ));
    
    register_rest_route('peptidi/v1', '/products/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'peptidi_get_product',
    ));
    
    register_rest_route('peptidi/v1', '/products/(?P<id>\d+)', array(
        'methods' => 'PUT',
        'callback' => 'peptidi_update_product',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        }
    ));
    
    register_rest_route('peptidi/v1', '/products/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'peptidi_delete_product',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        }
    ));
    
    register_rest_route('peptidi/v1', '/categories', array(
        'methods' => 'GET',
        'callback' => 'peptidi_get_categories',
    ));
    
    register_rest_route('peptidi/v1', '/categories', array(
        'methods' => 'POST',
        'callback' => 'peptidi_create_category',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        }
    ));
    
    register_rest_route('peptidi/v1', '/categories/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'peptidi_delete_category',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        }
    ));
    
    register_rest_route('peptidi/v1', '/orders', array(
        'methods' => 'POST',
        'callback' => 'peptidi_create_order',
    ));
    
    register_rest_route('peptidi/v1', '/orders', array(
        'methods' => 'GET',
        'callback' => 'peptidi_get_orders',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        }
    ));
    
    register_rest_route('peptidi/v1', '/auth/register', array(
        'methods' => 'POST',
        'callback' => 'peptidi_register_user',
    ));
    
    register_rest_route('peptidi/v1', '/auth/login', array(
        'methods' => 'POST',
        'callback' => 'peptidi_login_user',
    ));
    
    register_rest_route('peptidi/v1', '/auth/me', array(
        'methods' => 'GET',
        'callback' => 'peptidi_get_current_user',
        'permission_callback' => function() {
            return is_user_logged_in();
        }
    ));
});

function peptidi_get_products($request) {
    $category = $request->get_param('category');
    $args = array(
        'post_type' => 'product',
        'posts_per_page' => -1,
        'post_status' => 'publish',
    );
    
    if ($category) {
        $args['tax_query'] = array(
            array(
                'taxonomy' => 'product_category',
                'field' => 'slug',
                'terms' => $category,
            )
        );
    }
    
    $query = new WP_Query($args);
    $products = array();
    
    while ($query->have_posts()) {
        $query->the_post();
        $product_id = get_the_ID();
        $products[] = array(
            'id' => $product_id,
            'title' => get_the_title(),
            'description' => get_the_content(),
            'price' => get_post_meta($product_id, '_price', true),
            'image' => get_the_post_thumbnail_url($product_id, 'large'),
            'category' => wp_get_post_terms($product_id, 'product_category', array('fields' => 'slugs')),
            'stock' => get_post_meta($product_id, '_stock', true),
        );
    }
    
    wp_reset_postdata();
    return rest_ensure_response($products);
}

function peptidi_get_product($request) {
    $product_id = $request->get_param('id');
    $product = get_post($product_id);
    
    if (!$product || $product->post_type !== 'product') {
        return new WP_Error('not_found', 'Product not found', array('status' => 404));
    }
    
    return rest_ensure_response(array(
        'id' => $product_id,
        'title' => $product->post_title,
        'description' => $product->post_content,
        'price' => get_post_meta($product_id, '_price', true),
        'image' => get_the_post_thumbnail_url($product_id, 'large'),
        'category' => wp_get_post_terms($product_id, 'product_category', array('fields' => 'slugs')),
        'stock' => get_post_meta($product_id, '_stock', true),
    ));
}

function peptidi_create_product($request) {
    $title = $request->get_param('title');
    $description = $request->get_param('description');
    $price = $request->get_param('price');
    $image = $request->get_param('image');
    $category = $request->get_param('category');
    $stock = $request->get_param('stock');
    
    $product_id = wp_insert_post(array(
        'post_type' => 'product',
        'post_title' => $title,
        'post_content' => $description,
        'post_status' => 'publish',
    ));
    
    if (is_wp_error($product_id)) {
        return $product_id;
    }
    
    update_post_meta($product_id, '_price', $price);
    update_post_meta($product_id, '_stock', $stock);
    
    if ($image) {
        set_post_thumbnail($product_id, $image);
    }
    
    if ($category) {
        wp_set_object_terms($product_id, $category, 'product_category');
    }
    
    return rest_ensure_response(array('id' => $product_id));
}

function peptidi_update_product($request) {
    $product_id = $request->get_param('id');
    $title = $request->get_param('title');
    $description = $request->get_param('description');
    $price = $request->get_param('price');
    $image = $request->get_param('image');
    $category = $request->get_param('category');
    $stock = $request->get_param('stock');
    
    wp_update_post(array(
        'ID' => $product_id,
        'post_title' => $title,
        'post_content' => $description,
    ));
    
    if ($price !== null) update_post_meta($product_id, '_price', $price);
    if ($stock !== null) update_post_meta($product_id, '_stock', $stock);
    if ($image) set_post_thumbnail($product_id, $image);
    if ($category) wp_set_object_terms($product_id, $category, 'product_category');
    
    return rest_ensure_response(array('id' => $product_id));
}

function peptidi_delete_product($request) {
    $product_id = $request->get_param('id');
    wp_delete_post($product_id, true);
    return rest_ensure_response(array('deleted' => true));
}

function peptidi_get_categories($request) {
    $categories = get_terms(array(
        'taxonomy' => 'product_category',
        'hide_empty' => false,
    ));
    
    return rest_ensure_response($categories);
}

function peptidi_create_category($request) {
    $name = $request->get_param('name');
    $slug = $request->get_param('slug');
    $description = $request->get_param('description');
    
    $result = wp_insert_term($name, 'product_category', array(
        'description' => $description,
        'slug' => $slug,
    ));
    
    if (is_wp_error($result)) {
        return $result;
    }
    
    return rest_ensure_response(array('id' => $result['term_id']));
}

function peptidi_delete_category($request) {
    $category_id = $request->get_param('id');
    wp_delete_term($category_id, 'product_category');
    return rest_ensure_response(array('deleted' => true));
}

function peptidi_create_order($request) {
    $items = $request->get_param('items');
    $customer = $request->get_param('customer');
    
    $order_data = array(
        'items' => $items,
        'customer' => $customer,
        'date' => current_time('mysql'),
        'status' => 'pending',
    );
    
    add_option('peptidi_order_' . time(), $order_data);
    
    return rest_ensure_response(array('success' => true));
}

function peptidi_get_orders($request) {
    global $wpdb;
    $orders = array();
    
    for ($i = 0; $i < 100; $i++) {
        $order = get_option('peptidi_order_' . $i);
        if ($order) {
            $orders[] = $order;
        }
    }
    
    return rest_ensure_response($orders);
}

add_action('init', function() {
    register_post_type('product', array(
        'labels' => array(
            'name' => 'Products',
            'singular_name' => 'Product',
        ),
        'public' => true,
        'has_archive' => true,
        'show_in_rest' => true,
        'supports' => array('title', 'editor', 'thumbnail'),
    ));
    
    register_taxonomy('product_category', 'product', array(
        'labels' => array(
            'name' => 'Categories',
            'singular_name' => 'Category',
        ),
        'hierarchical' => true,
        'show_in_rest' => true,
    ));
});

function peptidi_register_user($request) {
    $email = $request->get_param('email');
    $password = $request->get_param('password');
    $name = $request->get_param('name');
    
    if (email_exists($email)) {
        return new WP_Error('email_exists', 'Email already registered', array('status' => 400));
    }
    
    $user_id = wp_create_user(sanitize_email($email), $password, sanitize_email($email));
    
    if (is_wp_error($user_id)) {
        return $user_id;
    }
    
    wp_update_user(array(
        'ID' => $user_id,
        'display_name' => $name,
        'first_name' => $name,
    ));
    
    $user = get_user_by('id', $user_id);
    $token = base64_encode($user_id . ':' . time());
    
    return rest_ensure_response(array(
        'user' => array(
            'id' => $user_id,
            'name' => $name,
            'email' => $email,
        ),
        'token' => $token
    ));
}

function peptidi_login_user($request) {
    $email = $request->get_param('email');
    $password = $request->get_param('password');
    
    $user = wp_authenticate($email, $password);
    
    if (is_wp_error($user)) {
        return new WP_Error('invalid_credentials', 'Invalid email or password', array('status' => 401));
    }
    
    $token = base64_encode($user->ID . ':' . time());
    
    return rest_ensure_response(array(
        'user' => array(
            'id' => $user->ID,
            'name' => $user->display_name,
            'email' => $user->user_email,
            'phone' => get_user_meta($user->ID, 'phone', true),
            'registered' => $user->user_registered,
        ),
        'token' => $token
    ));
}

function peptidi_get_current_user($request) {
    $user = wp_get_current_user();
    
    return rest_ensure_response(array(
        'id' => $user->ID,
        'name' => $user->display_name,
        'email' => $user->user_email,
        'phone' => get_user_meta($user->ID, 'phone', true),
        'registered' => $user->user_registered,
    ));
}

add_action('wp_footer', function() {
    if (is_admin()) return;
    ?>
    <style>
    .peptidi-cursor {
        position: fixed;
        width: 20px;
        height: 20px;
        border: 2px solid #6c5ce7;
        border-radius: 50%;
        pointer-events: none;
        z-index: 99999;
        transition: transform 0.15s ease, width 0.2s, height 0.2s, border-color 0.2s;
        transform: translate(-50%, -50%);
    }
    .peptidi-cursor-dot {
        position: fixed;
        width: 6px;
        height: 6px;
        background: #6c5ce7;
        border-radius: 50%;
        pointer-events: none;
        z-index: 99999;
        transform: translate(-50%, -50%);
    }
    .peptidi-cursor.hover {
        width: 50px;
        height: 50px;
        border-color: #a29bfe;
        background: rgba(108, 92, 231, 0.1);
    }
    .peptidi-floating-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    }
    .peptidi-floating-shape {
        position: absolute;
        border-radius: 50%;
        filter: blur(60px);
        opacity: 0.4;
        animation: float 20s ease-in-out infinite;
    }
    .peptidi-floating-shape:nth-child(1) {
        width: 400px;
        height: 400px;
        background: linear-gradient(135deg, #6c5ce7, #a29bfe);
        top: -100px;
        right: -100px;
        animation-delay: 0s;
    }
    .peptidi-floating-shape:nth-child(2) {
        width: 300px;
        height: 300px;
        background: linear-gradient(135deg, #00b894, #55efc4);
        bottom: 10%;
        left: -50px;
        animation-delay: -5s;
    }
    .peptidi-floating-shape:nth-child(3) {
        width: 250px;
        height: 250px;
        background: linear-gradient(135deg, #e17055, #fab1a0);
        top: 40%;
        right: 10%;
        animation-delay: -10s;
    }
    .peptidi-floating-shape:nth-child(4) {
        width: 200px;
        height: 200px;
        background: linear-gradient(135deg, #0984e3, #74b9ff);
        bottom: -50px;
        right: 30%;
        animation-delay: -15s;
    }
    .peptidi-floating-shape:nth-child(5) {
        width: 180px;
        height: 180px;
        background: linear-gradient(135deg, #fd79a8, #fdcb6e);
        top: 20%;
        left: 20%;
        animation-delay: -7s;
    }
    @keyframes float {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        25% { transform: translate(30px, -30px) rotate(5deg); }
        50% { transform: translate(-20px, 20px) rotate(-5deg); }
        75% { transform: translate(20px, 10px) rotate(3deg); }
    }
    .peptidi-particles {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    }
    .peptidi-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(108, 92, 231, 0.6);
        border-radius: 50%;
        animation: particleFloat 15s ease-in-out infinite;
    }
    .peptidi-particle:nth-child(odd) {
        background: rgba(0, 184, 148, 0.5);
    }
    @keyframes particleFloat {
        0%, 100% { transform: translateY(100vh) scale(0); opacity: 0; }
        10% { opacity: 1; transform: translateY(90vh) scale(1); }
        90% { opacity: 1; transform: translateY(10vh) scale(1); }
        100% { opacity: 0; transform: translateY(0) scale(0); }
    }
    .peptidi-home-content {
        position: relative;
        z-index: 10;
        padding: 40px 20px;
        max-width: 1200px;
        margin: 0 auto;
    }
    .peptidi-hero {
        text-align: center;
        padding: 60px 20px;
        background: linear-gradient(135deg, rgba(108, 92, 231, 0.1), rgba(0, 184, 148, 0.1));
        border-radius: 24px;
        margin-bottom: 40px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .peptidi-hero h1 {
        font-size: 48px;
        font-weight: 800;
        background: linear-gradient(135deg, #6c5ce7, #00b894);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 20px;
    }
    .peptidi-hero p {
        font-size: 18px;
        color: #636e72;
        max-width: 600px;
        margin: 0 auto 30px;
        line-height: 1.6;
    }
    .peptidi-hero-search {
        display: flex;
        max-width: 500px;
        margin: 0 auto;
        gap: 10px;
    }
    .peptidi-hero-search input {
        flex: 1;
        padding: 16px 24px;
        border: 2px solid rgba(108, 92, 231, 0.2);
        border-radius: 50px;
        font-size: 16px;
        outline: none;
        transition: border-color 0.3s;
        background: rgba(255, 255, 255, 0.9);
    }
    .peptidi-hero-search input:focus {
        border-color: #6c5ce7;
    }
    .peptidi-hero-search button {
        padding: 16px 32px;
        background: linear-gradient(135deg, #6c5ce7, #a29bfe);
        color: white;
        border: none;
        border-radius: 50px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .peptidi-hero-search button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(108, 92, 231, 0.4);
    }
    .peptidi-blocks-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
        margin-bottom: 40px;
    }
    .peptidi-block {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 32px;
        border: 1px solid rgba(255, 255, 255, 0.5);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
        transition: transform 0.3s, box-shadow 0.3s;
    }
    .peptidi-block:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }
    .peptidi-block-icon {
        width: 60px;
        height: 60px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        margin-bottom: 20px;
    }
    .peptidi-block h3 {
        font-size: 20px;
        font-weight: 700;
        color: #2d3436;
        margin-bottom: 12px;
    }
    .peptidi-block p {
        color: #636e72;
        line-height: 1.6;
        font-size: 14px;
    }
    .peptidi-block-purple .peptidi-block-icon { background: linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(162, 155, 254, 0.2)); }
    .peptidi-block-green .peptidi-block-icon { background: linear-gradient(135deg, rgba(0, 184, 148, 0.2), rgba(85, 239, 196, 0.2)); }
    .peptidi-block-orange .peptidi-block-icon { background: linear-gradient(135deg, rgba(225, 112, 85, 0.2), rgba(250, 177, 160, 0.2)); }
    .peptidi-block-blue .peptidi-block-icon { background: linear-gradient(135deg, rgba(9, 132, 227, 0.2), rgba(116, 185, 255, 0.2)); }
    .peptidi-block-pink .peptidi-block-icon { background: linear-gradient(135deg, rgba(253, 121, 168, 0.2), rgba(253, 203, 110, 0.2)); }
    .peptidi-block-cyan .peptidi-block-icon { background: linear-gradient(135deg, rgba(0, 206, 201, 0.2), rgba(162, 155, 254, 0.2)); }
    .peptidi-categories {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 40px;
    }
    .peptidi-category-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6));
        backdrop-filter: blur(20px);
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        border: 1px solid rgba(108, 92, 231, 0.1);
        cursor: pointer;
        transition: all 0.3s;
    }
    .peptidi-category-card:hover {
        transform: scale(1.05);
        border-color: rgba(108, 92, 231, 0.3);
        box-shadow: 0 10px 30px rgba(108, 92, 231, 0.15);
    }
    .peptidi-category-card span {
        font-size: 40px;
        display: block;
        margin-bottom: 12px;
    }
    .peptidi-category-card strong {
        display: block;
        color: #2d3436;
        font-size: 14px;
        margin-bottom: 4px;
    }
    .peptidi-category-card small {
        color: #636e72;
        font-size: 12px;
    }
    .peptidi-promobanner {
        background: linear-gradient(135deg, #6c5ce7, #a29bfe);
        border-radius: 24px;
        padding: 48px;
        color: white;
        text-align: center;
        margin-bottom: 40px;
        position: relative;
        overflow: hidden;
    }
    .peptidi-promobanner::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
        animation: pulse 4s ease-in-out infinite;
    }
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.1); opacity: 0.8; }
    }
    .peptidi-promobanner h2 {
        font-size: 32px;
        font-weight: 800;
        margin-bottom: 16px;
        position: relative;
    }
    .peptidi-promobanner p {
        font-size: 18px;
        opacity: 0.9;
        margin-bottom: 24px;
        position: relative;
    }
    .peptidi-promobanner .promo-badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.2);
        padding: 8px 24px;
        border-radius: 50px;
        font-weight: 600;
        font-size: 14px;
        position: relative;
    }
    .peptidi-trust-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 40px;
    }
    .peptidi-trust-item {
        text-align: center;
        padding: 24px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 16px;
        border: 1px solid rgba(108, 92, 231, 0.1);
    }
    .peptidi-trust-item strong {
        display: block;
        font-size: 28px;
        font-weight: 800;
        background: linear-gradient(135deg, #6c5ce7, #00b894);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 8px;
    }
    .peptidi-trust-item span {
        color: #636e72;
        font-size: 13px;
    }
    .peptidi-newsletter {
        background: linear-gradient(135deg, rgba(0, 184, 148, 0.1), rgba(108, 92, 231, 0.1));
        border-radius: 24px;
        padding: 48px;
        text-align: center;
        border: 1px solid rgba(108, 92, 231, 0.1);
    }
    .peptidi-newsletter h3 {
        font-size: 24px;
        font-weight: 700;
        color: #2d3436;
        margin-bottom: 12px;
    }
    .peptidi-newsletter p {
        color: #636e72;
        margin-bottom: 24px;
    }
    .peptidi-newsletter form {
        display: flex;
        max-width: 400px;
        margin: 0 auto;
        gap: 10px;
    }
    .peptidi-newsletter input {
        flex: 1;
        padding: 14px 20px;
        border: 2px solid rgba(108, 92, 231, 0.2);
        border-radius: 50px;
        font-size: 14px;
        outline: none;
    }
    .peptidi-newsletter button {
        padding: 14px 28px;
        background: linear-gradient(135deg, #00b894, #55efc4);
        color: white;
        border: none;
        border-radius: 50px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
    }
    .peptidi-newsletter button:hover {
        transform: scale(1.05);
    }
    @media (max-width: 768px) {
        .peptidi-hero h1 { font-size: 32px; }
        .peptidi-trust-grid { grid-template-columns: repeat(2, 1fr); }
        .peptidi-promobanner { padding: 32px 20px; }
        .peptidi-newsletter form { flex-direction: column; }
        .peptidi-hero-search { flex-direction: column; }
    }
    </style>
    
    <div class="peptidi-floating-bg">
        <div class="peptidi-floating-shape"></div>
        <div class="peptidi-floating-shape"></div>
        <div class="peptidi-floating-shape"></div>
        <div class="peptidi-floating-shape"></div>
        <div class="peptidi-floating-shape"></div>
    </div>
    
    <div class="peptidi-particles">
        <div class="peptidi-particle" style="left: 10%; animation-delay: 0s;"></div>
        <div class="peptidi-particle" style="left: 20%; animation-delay: -2s;"></div>
        <div class="peptidi-particle" style="left: 35%; animation-delay: -4s;"></div>
        <div class="peptidi-particle" style="left: 50%; animation-delay: -1s;"></div>
        <div class="peptidi-particle" style="left: 65%; animation-delay: -3s;"></div>
        <div class="peptidi-particle" style="left: 80%; animation-delay: -5s;"></div>
        <div class="peptidi-particle" style="left: 90%; animation-delay: -7s;"></div>
    </div>
    
    <div class="peptidi-home-content">
        <div class="peptidi-hero">
            <h1>Пептиды нового поколения</h1>
            <p>Высокочистые пептиды для научных исследований и персональной оптимизации. Прямые поставки с GMP-сертифицированных производств.</p>
            <div class="peptidi-hero-search">
                <input type="text" placeholder="Поиск пептидов..." />
                <button>Найти</button>
            </div>
        </div>
        
        <div class="peptidi-trust-grid">
            <div class="peptidi-trust-item">
                <strong>98.5%+</strong>
                <span>Чистота пептидов</span>
            </div>
            <div class="peptidi-trust-item">
                <strong>5000+</strong>
                <span>Довольных клиентов</span>
            </div>
            <div class="peptidi-trust-item">
                <strong>24ч</strong>
                <span>Быстрая доставка</span>
            </div>
            <div class="peptidi-trust-item">
                <strong>100%</strong>
                <span>Гарантия качества</span>
            </div>
        </div>
        
        <div class="peptidi-categories">
            <div class="peptidi-category-card">
                <span>💉</span>
                <strong>Инъекционные</strong>
                <small>Флаконы 5-10 мг</small>
            </div>
            <div class="peptidi-category-card">
                <span>💊</span>
                <strong>Капсулы</strong>
                <small>Готовые формы</small>
            </div>
            <div class="peptidi-category-card">
                <span>🧪</span>
                <strong>Порошки</strong>
                <small>Для самостоятельного приготовления</small>
            </div>
            <div class="peptidi-category-card">
                <span>🧬</span>
                <strong>Пептидные комплексы</strong>
                <small>Комбинированные решения</small>
            </div>
        </div>
        
        <div class="peptidi-blocks-grid">
            <div class="peptidi-block peptidi-block-purple">
                <div class="peptidi-block-icon">🔬</div>
                <h3>Лабораторное качество</h3>
                <p>Каждая партия проходит тройной контроль качества: HPLC, Mass-Spectrometry, AA Analysis. Сертификаты анализа прилагаются.</p>
            </div>
            <div class="peptidi-block peptidi-block-green">
                <div class="peptidi-block-icon">🚀</div>
                <h3>Быстрая доставка</h3>
                <p>Отправка в день заказа. DHL, FedEx, EMS — доставка в 150+ стран мира. Отслеживание посылки в реальном времени.</p>
            </div>
            <div class="peptidi-block peptidi-block-orange">
                <div class="peptidi-block-icon">💳</div>
                <h3>Безопасная оплата</h3>
                <p>Криптовалюта, банковские карты, PayPal. Все транзакции защищены. Анонимность гарантирована.</p>
            </div>
            <div class="peptidi-block peptidi-block-blue">
                <div class="peptidi-block-icon">🛡️</div>
                <h3>Гарантия результата</h3>
                <p>30-дневная гарантия возврата. Если продукт не соответствует заявленной чистоте — полный возврат средств.</p>
            </div>
            <div class="peptidi-block peptidi-block-pink">
                <div class="peptidi-block-icon">📚</div>
                <h3>Экспертная поддержка</h3>
                <p>Консультации специалистов с фармацевтическим образованием. Поможем подобрать пептиды под ваши цели.</p>
            </div>
            <div class="peptidi-block peptidi-block-cyan">
                <div class="peptidi-block-icon">🏆</div>
                <h3>Оптовые условия</h3>
                <p>Скидки до 40% при заказе от 10 единиц. Специальные условия для постоянных клиентов и лабораторий.</p>
            </div>
        </div>
        
        <div class="peptidi-promobanner">
            <h2>Новая коллекция пептидов 2026</h2>
            <p>Обновленный каталог с 50+ новыми позициями. Снижение цен до 25% на популярные позиции.</p>
            <span class="promo-badge">🔥 Горячее предложение</span>
        </div>
        
        <div class="peptidi-newsletter">
            <h3>Подпишитесь на обновления</h3>
            <p>Получайте информацию о новинках, скидках и эксклюзивных предложениях</p>
            <form>
                <input type="email" placeholder="Ваш email" />
                <button type="submit">Подписаться</button>
            </form>
        </div>
    </div>
    
    <script>
    (function() {
        const cursor = document.querySelector('.peptidi-cursor');
        const dot = document.querySelector('.peptidi-cursor-dot');
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let dotX = 0, dotY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        function animate() {
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;
            dotX += (mouseX - dotX) * 0.35;
            dotY += (mouseY - dotY) * 0.35;
            
            const targets = document.querySelectorAll('a, button, .btn, input, [role="button"], .peptidi-block, .peptidi-category-card');
            let isHover = false;
            
            targets.forEach(el => {
                const rect = el.getBoundingClientRect();
                const dist = Math.hypot(mouseX - (rect.left + rect.width/2), mouseY - (rect.top + rect.height/2));
                if (dist < 80) {
                    isHover = true;
                    const pull = (80 - dist) / 80 * 20;
                    cursorX -= (cursorX - mouseX) * pull * 0.01;
                    cursorY -= (cursorY - mouseY) * pull * 0.01;
                }
            });
            
            cursor.classList.toggle('hover', isHover);
            
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            dot.style.left = dotX + 'px';
            dot.style.top = dotY + 'px';
            
            requestAnimationFrame(animate);
        }
        
        if (window.matchMedia('(pointer: fine)').matches) {
            animate();
        }
        
        document.addEventListener('mousedown', () => cursor.style.transform = 'translate(-50%, -50%) scale(0.8)');
        document.addEventListener('mouseup', () => cursor.style.transform = 'translate(-50%, -50%) scale(1)');
    })();
    </script>
    <?php
});
