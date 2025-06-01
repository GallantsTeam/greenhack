
// src/app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { Product, ProductPricingOption } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic'; 

export async function GET(request: NextRequest) {
  try {
    const productsData = await query(
      `SELECT 
         p.id, p.name, p.slug, p.game_slug, p.image_url, 
         p.status, p.status_text, 
         p.short_description, p.long_description, p.data_ai_hint,
         p.mode, p.gallery_image_urls,
         p.functions_aim_title, p.functions_aim, p.functions_aim_description,
         p.functions_esp_title, p.functions_wallhack, p.functions_esp_description,
         p.functions_misc_title, p.functions_misc, p.functions_misc_description,
         p.system_os, p.system_build, p.system_gpu, p.system_cpu,
         p.price_text,
         p.retrieval_modal_intro_text,
         p.retrieval_modal_antivirus_text,
         p.retrieval_modal_antivirus_link_text,
         p.retrieval_modal_antivirus_link_url,
         p.retrieval_modal_launcher_text,
         p.retrieval_modal_launcher_link_text,
         p.retrieval_modal_launcher_link_url,
         p.retrieval_modal_key_paste_text,
         p.retrieval_modal_support_text,
         p.retrieval_modal_support_link_text,
         p.retrieval_modal_support_link_url,
         p.retrieval_modal_how_to_run_link,
         p.activation_type, p.loader_download_url, p.info_modal_content_html, 
         p.info_modal_support_link_text, p.info_modal_support_link_url,
         p.created_at, p.updated_at,
         (SELECT MIN(ppo.price_rub) FROM product_pricing_options ppo WHERE ppo.product_id = p.id AND ppo.is_rub_payment_visible = TRUE) as min_price_rub_calculated,
         (SELECT MIN(ppo.price_gh) FROM product_pricing_options ppo WHERE ppo.product_id = p.id AND ppo.is_gh_payment_visible = TRUE) as min_price_gh_calculated,
         COALESCE(g.name, p.game_slug) as gameName,
         g.logo_url as gameLogoUrl,
         g.platform as gamePlatform
       FROM products p
       LEFT JOIN games g ON p.game_slug = g.slug 
       ORDER BY p.created_at DESC, p.name ASC`
    );

    if (!Array.isArray(productsData)) {
      console.error('API Admin Products GET Error: Expected an array from database query, received:', productsData);
      return NextResponse.json({ message: 'Failed to retrieve products: unexpected database response format.' }, { status: 500 });
    }

    const products: Product[] = productsData.map((row: any) => ({
      id: String(row.id).trim(),
      name: row.name,
      slug: String(row.slug).trim(),
      game_slug: String(row.game_slug).trim(),
      image_url: row.image_url ? String(row.image_url).trim() : null,
      imageUrl: (row.image_url || `https://placehold.co/300x350.png?text=${encodeURIComponent(row.name)}`).trim(),
      status: (row.status ? String(row.status).toLowerCase() : 'unknown') as Product['status'],
      status_text: row.status_text,
      price: parseFloat(row.min_price_rub_calculated || '0'), 
      min_price_rub: row.min_price_rub_calculated ? parseFloat(row.min_price_rub_calculated) : undefined,
      min_price_gh: row.min_price_gh_calculated ? parseFloat(row.min_price_gh_calculated) : undefined,
      price_text: row.price_text,
      short_description: row.short_description,
      long_description: row.long_description,
      data_ai_hint: row.data_ai_hint || `${String(row.name).toLowerCase()} product`,
      mode: row.mode,
      gallery_image_urls: row.gallery_image_urls ? String(row.gallery_image_urls).split(',').map((url: string) => url.trim()).filter(Boolean) : [],
      functions_aim_title: row.functions_aim_title || 'Aimbot Функции',
      functions_aim: row.functions_aim ? String(row.functions_aim).split(',').map((fn: string) => fn.trim()).filter(Boolean) : [],
      functions_aim_description: row.functions_aim_description,
      functions_esp_title: row.functions_esp_title || 'ESP/Wallhack Функции',
      functions_wallhack: row.functions_wallhack ? String(row.functions_wallhack).split(',').map((fn: string) => fn.trim()).filter(Boolean) : [],
      functions_esp_description: row.functions_esp_description,
      functions_misc_title: row.functions_misc_title || 'Прочие Функции',
      functions_misc: row.functions_misc ? String(row.functions_misc).split(',').map((fn: string) => fn.trim()).filter(Boolean) : [],
      functions_misc_description: row.functions_misc_description,
      system_os: row.system_os,
      system_build: row.system_build,
      system_gpu: row.system_gpu,
      system_cpu: row.system_cpu,
      retrieval_modal_intro_text: row.retrieval_modal_intro_text,
      retrieval_modal_antivirus_text: row.retrieval_modal_antivirus_text,
      retrieval_modal_antivirus_link_text: row.retrieval_modal_antivirus_link_text,
      retrieval_modal_antivirus_link_url: row.retrieval_modal_antivirus_link_url,   
      retrieval_modal_launcher_text: row.retrieval_modal_launcher_text,
      retrieval_modal_launcher_link_text: row.retrieval_modal_launcher_link_text,
      retrieval_modal_launcher_link_url: row.retrieval_modal_launcher_link_url,   
      retrieval_modal_key_paste_text: row.retrieval_modal_key_paste_text,
      retrieval_modal_support_text: row.retrieval_modal_support_text,
      retrieval_modal_support_link_text: row.retrieval_modal_support_link_text,
      retrieval_modal_support_link_url: row.retrieval_modal_support_link_url,   
      retrieval_modal_how_to_run_link: row.retrieval_modal_how_to_run_link,
      activation_type: row.activation_type || 'info_modal',
      loader_download_url: row.loader_download_url,
      info_modal_content_html: row.info_modal_content_html,
      info_modal_support_link_text: row.info_modal_support_link_text,
      info_modal_support_link_url: row.info_modal_support_link_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
      gameName: row.gameName,
      gameLogoUrl: row.gameLogoUrl ? String(row.gameLogoUrl).trim() : null,
      gamePlatform: row.gamePlatform, 
    }));

    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error('API Admin Products GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}`, error_details: error.toString() }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
    const {
      id, 
      name,
      slug,
      game_slug: raw_game_slug, 
      status,
      pricing_options,
      activation_type, // New activation fields
      loader_download_url,
      info_modal_content_html,
      info_modal_support_link_text,
      info_modal_support_link_url,
      ...optionalFieldsData
    } = body;

    const trimmedId = id ? String(id).trim() : null;
    const trimmedSlug = slug ? String(slug).trim() : null;
    const trimmedGameSlug = raw_game_slug ? String(raw_game_slug).trim() : null;


    if (!trimmedId || !name || !trimmedSlug || !trimmedGameSlug || !status) {
      return NextResponse.json({ message: 'ID, Name, Slug, Game Slug, and Status are required.' }, { status: 400 });
    }
    if (trimmedId !== trimmedSlug) {
        return NextResponse.json({ message: 'Product ID and Slug must match for new products.' }, { status: 400 });
    }

    const existingProduct = await query('SELECT id FROM products WHERE id = ? OR slug = ?', [trimmedId, trimmedSlug]);
    if (Array.isArray(existingProduct) && existingProduct.length > 0) {
      return NextResponse.json({ message: 'Product with this ID or Slug already exists.' }, { status: 409 });
    }
    
    const productFieldsToInsert: Record<string, any> = {
      id: trimmedId, 
      name, 
      slug: trimmedSlug, 
      game_slug: trimmedGameSlug, 
      status, 
      activation_type: activation_type || 'info_modal',
      loader_download_url: loader_download_url || null,
      info_modal_content_html: info_modal_content_html || null,
      info_modal_support_link_text: info_modal_support_link_text || null,
      info_modal_support_link_url: info_modal_support_link_url || null,
      created_at: new Date(), updated_at: new Date(),
      functions_aim_title: optionalFieldsData.functions_aim_title || 'Aimbot Функции',
      functions_esp_title: optionalFieldsData.functions_esp_title || 'ESP/Wallhack Функции',
      functions_misc_title: optionalFieldsData.functions_misc_title || 'Прочие Функции',
    };
    
    const allOptionalFieldKeys: (keyof Product)[] = [
        'image_url', 'status_text', 'short_description', 'long_description', 'data_ai_hint', 'mode',
        'gallery_image_urls', 
        'functions_aim', 'functions_aim_description',
        'functions_wallhack', 'functions_esp_description',
        'functions_misc', 'functions_misc_description',
        'system_os', 'system_build', 'system_gpu', 'system_cpu', 'price_text',
        'retrieval_modal_intro_text', 'retrieval_modal_antivirus_text', 'retrieval_modal_antivirus_link_text', 'retrieval_modal_antivirus_link_url',
        'retrieval_modal_launcher_text', 'retrieval_modal_launcher_link_text', 'retrieval_modal_launcher_link_url',
        'retrieval_modal_key_paste_text', 'retrieval_modal_support_text', 'retrieval_modal_support_link_text', 'retrieval_modal_support_link_url',
        'retrieval_modal_how_to_run_link',
    ];

    allOptionalFieldKeys.forEach(key => {
        if (optionalFieldsData[key] !== undefined) {
            if (key === 'gallery_image_urls' && Array.isArray(optionalFieldsData[key])) {
                 productFieldsToInsert[key] = (optionalFieldsData[key] as string[]).join(',');
            } else {
                productFieldsToInsert[key] = optionalFieldsData[key] === '' ? null : optionalFieldsData[key];
            }
        }
    });
    
    const columns = Object.keys(productFieldsToInsert);
    const placeholders = columns.map(() => '?').join(', ');
    const productParams = Object.values(productFieldsToInsert);
    
    const productInsertQuery = `INSERT INTO products (${columns.join(', ')}) VALUES (${placeholders})`;
    
    const productResult = await query(productInsertQuery, productParams) as OkPacket | ResultSetHeader | any[];

    let productAffectedRows = 0;
    if (productResult && 'affectedRows' in productResult && !Array.isArray(productResult)) {
        productAffectedRows = (productResult as OkPacket).affectedRows;
    } else if (Array.isArray(productResult) && productResult.length > 0 && 'affectedRows' in productResult[0]) {
        productAffectedRows = productResult[0].affectedRows;
    }

    if (productAffectedRows > 0) {
      const productIdForOptions = trimmedId; 

      if (pricing_options && Array.isArray(pricing_options) && pricing_options.length > 0) {
        for (const option of pricing_options) {
          const { 
            duration_days, price_rub, price_gh, mode_label,
            is_rub_payment_visible, is_gh_payment_visible,
            custom_payment_1_label, custom_payment_1_price_rub, custom_payment_1_link, custom_payment_1_is_visible,
            custom_payment_2_label, custom_payment_2_price_rub, custom_payment_2_link, custom_payment_2_is_visible
          } = option;
          await query(
            `INSERT INTO product_pricing_options (
                product_id, duration_days, price_rub, price_gh, mode_label,
                is_rub_payment_visible, is_gh_payment_visible,
                custom_payment_1_label, custom_payment_1_price_rub, custom_payment_1_link, custom_payment_1_is_visible,
                custom_payment_2_label, custom_payment_2_price_rub, custom_payment_2_link, custom_payment_2_is_visible
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                productIdForOptions, duration_days, price_rub, price_gh, mode_label || null,
                is_rub_payment_visible === undefined ? true : Boolean(is_rub_payment_visible),
                is_gh_payment_visible === undefined ? true : Boolean(is_gh_payment_visible),
                custom_payment_1_label || null, custom_payment_1_price_rub || null, custom_payment_1_link || null, Boolean(custom_payment_1_is_visible),
                custom_payment_2_label || null, custom_payment_2_price_rub || null, custom_payment_2_link || null, Boolean(custom_payment_2_is_visible)
            ]
          );
        }
      }

      const newProductDataResult = await query(
        `SELECT 
            p.*,
            (SELECT MIN(ppo_in.price_rub) FROM product_pricing_options ppo_in WHERE ppo_in.product_id = p.id AND ppo_in.is_rub_payment_visible = TRUE) as min_price_rub_calculated,
            (SELECT MIN(ppo_in.price_gh) FROM product_pricing_options ppo_in WHERE ppo_in.product_id = p.id AND ppo_in.is_gh_payment_visible = TRUE) as min_price_gh_calculated,
            COALESCE(g.name, p.game_slug) as gameName,
            g.logo_url as gameLogoUrl,
            g.platform as gamePlatform
         FROM products p
         LEFT JOIN games g ON p.game_slug = g.slug
         WHERE p.id = ?`, [productIdForOptions]);

       if (!Array.isArray(newProductDataResult) || newProductDataResult.length === 0) {
        console.error('Failed to fetch newly created product from DB:', productIdForOptions);
        return NextResponse.json({ message: 'Товар создан, но не удалось получить его обновленные данные.' }, { status: 500 });
      }
      const row = newProductDataResult[0];
      const newProductItem: Product = {
        id: String(row.id).trim(),
        name: row.name,
        slug: String(row.slug).trim(),
        game_slug: String(row.game_slug).trim(),
        image_url: row.image_url ? String(row.image_url).trim() : null,
        imageUrl: (row.image_url || `https://placehold.co/300x350.png?text=${encodeURIComponent(row.name)}`).trim(),
        status: row.status || 'unknown',
        status_text: row.status_text,
        price: parseFloat(row.min_price_rub_calculated || '0'), 
        min_price_rub: row.min_price_rub_calculated ? parseFloat(row.min_price_rub_calculated) : undefined,
        min_price_gh: row.min_price_gh_calculated ? parseFloat(row.min_price_gh_calculated) : undefined,
        price_text: row.price_text,
        short_description: row.short_description,
        long_description: row.long_description,
        data_ai_hint: row.data_ai_hint || `${String(row.name).toLowerCase()} product`,
        mode: row.mode,
        gallery_image_urls: row.gallery_image_urls ? String(row.gallery_image_urls).split(',').map((url: string) => url.trim()).filter(Boolean) : [],
        functions_aim_title: row.functions_aim_title,
        functions_aim: row.functions_aim ? String(row.functions_aim).split(',').map((fn: string) => fn.trim()).filter(Boolean) : [],
        functions_aim_description: row.functions_aim_description,
        functions_esp_title: row.functions_esp_title,
        functions_wallhack: row.functions_wallhack ? String(row.functions_wallhack).split(',').map((fn: string) => fn.trim()).filter(Boolean) : [],
        functions_esp_description: row.functions_esp_description,
        functions_misc_title: row.functions_misc_title,
        functions_misc: row.functions_misc ? String(row.functions_misc).split(',').map((fn: string) => fn.trim()).filter(Boolean) : [],
        functions_misc_description: row.functions_misc_description,
        system_os: row.system_os,
        system_build: row.system_build,
        system_gpu: row.system_gpu,
        system_cpu: row.system_cpu,
        pricing_options: [], 
        retrieval_modal_intro_text: row.retrieval_modal_intro_text,
        retrieval_modal_antivirus_text: row.retrieval_modal_antivirus_text,
        retrieval_modal_antivirus_link_text: row.retrieval_modal_antivirus_link_text, 
        retrieval_modal_antivirus_link_url: row.retrieval_modal_antivirus_link_url,   
        retrieval_modal_launcher_text: row.retrieval_modal_launcher_text,
        retrieval_modal_launcher_link_text: row.retrieval_modal_launcher_link_text, 
        retrieval_modal_launcher_link_url: row.retrieval_modal_launcher_link_url,   
        retrieval_modal_key_paste_text: row.retrieval_modal_key_paste_text,
        retrieval_modal_support_text: row.retrieval_modal_support_text,
        retrieval_modal_support_link_text: row.retrieval_modal_support_link_text, 
        retrieval_modal_support_link_url: row.retrieval_modal_support_link_url,   
        retrieval_modal_how_to_run_link: row.retrieval_modal_how_to_run_link,
        activation_type: row.activation_type || 'info_modal',
        loader_download_url: row.loader_download_url,
        info_modal_content_html: row.info_modal_content_html,
        info_modal_support_link_text: row.info_modal_support_link_text,
        info_modal_support_link_url: row.info_modal_support_link_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
        gameName: row.gameName,
        gameLogoUrl: row.gameLogoUrl ? String(row.gameLogoUrl).trim() : null,
        gamePlatform: row.gamePlatform,
      };
      return NextResponse.json({ message: 'Товар успешно создан', product: newProductItem }, { status: 201 });
    } else {
      console.error('Product creation in DB failed, no affected rows:', productResult);
      return NextResponse.json({ message: 'Не удалось создать товар в базе данных.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Admin Products POST Error:', error);
    const requestBodyForLog = body || "Could not parse request body for logging";
    console.error('Request body was:', JSON.stringify(requestBodyForLog, null, 2));

    if (error.code === 'ER_NO_REFERENCED_ROW_2' || (error.message && error.message.includes('foreign key constraint fails'))) {
        return NextResponse.json({ message: `Ошибка внешнего ключа: Убедитесь, что указанный 'game_slug' (${(body as any)?.game_slug?.trim()}) существует в таблице категорий (games).`, error_details: error.toString() }, { status: 400 });
    }
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
        return NextResponse.json({ message: `Ошибка типа данных: Пожалуйста, проверьте правильность введенных числовых значений (например, цена, ID).`, error_details: error.toString() }, { status: 400 });
    }
    return NextResponse.json({ message: `Internal Server Error: ${error.message}`, error_details: error.toString() }, { status: 500 });
  }
}
    
