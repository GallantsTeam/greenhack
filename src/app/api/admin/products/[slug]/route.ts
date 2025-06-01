
// src/app/api/admin/products/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { Product, ProductPricingOption } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

async function getProductBySlugForUpdate(slug: string): Promise<Product | null> {
    const productResults = await query(
      `SELECT 
         p.*,
         COALESCE(g.name, p.game_slug) as gameName,
         g.logo_url as gameLogoUrl 
       FROM products p
       LEFT JOIN games g ON p.game_slug = g.slug
       WHERE p.slug = ?`, [String(slug).trim()]); // Trim slug for query
    if (!Array.isArray(productResults) || productResults.length === 0) return null;

    const productData = productResults[0];
    
    productData.id = String(productData.id).trim();
    productData.slug = String(productData.slug).trim();
    productData.game_slug = String(productData.game_slug).trim();
    productData.gallery_image_urls = productData.gallery_image_urls ? String(productData.gallery_image_urls).split(',').map((url: string) => url.trim()) : [];
    productData.functions_aim = productData.functions_aim ? String(productData.functions_aim).split(',').map((fn: string) => fn.trim()) : [];
    productData.functions_wallhack = productData.functions_wallhack ? String(productData.functions_wallhack).split(',').map((fn: string) => fn.trim()) : [];
    productData.functions_misc = productData.functions_misc ? String(productData.functions_misc).split(',').map((fn: string) => fn.trim()) : [];
    
    productData.functions_aim_title = productData.functions_aim_title || 'Aimbot Функции';
    productData.functions_esp_title = productData.functions_esp_title || 'ESP/Wallhack Функции';
    productData.functions_misc_title = productData.functions_misc_title || 'Прочие Функции';
    
    return productData as Product;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const productSlug = params.slug ? String(params.slug).trim() : null;
  if (!productSlug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }
  try {
    const product = await getProductBySlugForUpdate(productSlug);
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    const pricingOptionsResults = await query(
      'SELECT * FROM product_pricing_options WHERE product_id = ? ORDER BY duration_days ASC, mode_label ASC',
      [product.id] 
    );
    product.pricing_options = pricingOptionsResults.map((opt: any) => ({
      ...opt,
      product_id: String(opt.product_id).trim(),
      price_rub: parseFloat(opt.price_rub),
      price_gh: parseFloat(opt.price_gh),
      is_rub_payment_visible: opt.is_rub_payment_visible === undefined ? true : Boolean(opt.is_rub_payment_visible),
      is_gh_payment_visible: opt.is_gh_payment_visible === undefined ? true : Boolean(opt.is_gh_payment_visible),
      custom_payment_1_label: opt.custom_payment_1_label,
      custom_payment_1_price_rub: opt.custom_payment_1_price_rub ? parseFloat(opt.custom_payment_1_price_rub) : null,
      custom_payment_1_link: opt.custom_payment_1_link,
      custom_payment_1_is_visible: Boolean(opt.custom_payment_1_is_visible),
      custom_payment_2_label: opt.custom_payment_2_label,
      custom_payment_2_price_rub: opt.custom_payment_2_price_rub ? parseFloat(opt.custom_payment_2_price_rub) : null,
      custom_payment_2_link: opt.custom_payment_2_link,
      custom_payment_2_is_visible: Boolean(opt.custom_payment_2_is_visible),
      mode_label: opt.mode_label,
    }));

    return NextResponse.json(product);
  } catch (error: any) {
    console.error(`API Admin Product GET (slug: ${productSlug}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}`, error_details: error.toString() }, { status: 500 });
  }
}


export async function PUT(
  request: NextRequest,
  { params: routeParams }: { params: { slug: string } }
) {
  const productSlug = routeParams.slug ? String(routeParams.slug).trim() : null;

  if (!productSlug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }
  let body;
  try {
    body = await request.json();
    const {
      name, 
      slug: newSlugRaw,
      game_slug: gameSlugRaw, 
      status, 
      status_text, 
      short_description,
      long_description, 
      image_url, 
      data_ai_hint, 
      mode,
      gallery_image_urls, 
      functions_aim_title,
      functions_aim,  
      functions_aim_description,    
      functions_esp_title,
      functions_wallhack, 
      functions_esp_description,
      functions_misc_title,
      functions_misc,   
      functions_misc_description,  
      system_os, 
      system_build, 
      system_gpu, 
      system_cpu, 
      price_text,
      retrieval_modal_intro_text, retrieval_modal_antivirus_text, retrieval_modal_antivirus_link_text, retrieval_modal_antivirus_link_url,
      retrieval_modal_launcher_text, retrieval_modal_launcher_link_text, retrieval_modal_launcher_link_url,
      retrieval_modal_key_paste_text, retrieval_modal_support_text, retrieval_modal_support_link_text, retrieval_modal_support_link_url,
      retrieval_modal_how_to_run_link,
      activation_type, // New activation fields
      loader_download_url,
      info_modal_content_html,
      info_modal_support_link_text,
      info_modal_support_link_url,
      pricing_options
    } = body;

    const existingProduct = await getProductBySlugForUpdate(productSlug);
    if (!existingProduct) {
      return NextResponse.json({ message: `Товар со slug '${productSlug}' не найден.` }, { status: 404 });
    }
    
    const targetProductId = existingProduct.id; 
    let effectiveSlug = productSlug;
    const newSlug = newSlugRaw ? String(newSlugRaw).trim() : null;
    const gameSlug = gameSlugRaw ? String(gameSlugRaw).trim() : null;


    if (newSlug && newSlug !== productSlug) {
        const anotherProductWithNewSlug = await query('SELECT id FROM products WHERE slug = ? AND id != ?', [newSlug, targetProductId]);
        if (Array.isArray(anotherProductWithNewSlug) && anotherProductWithNewSlug.length > 0) {
          return NextResponse.json({ message: `Товар с новым slug '${newSlug}' уже существует.` }, { status: 409 });
        }
        effectiveSlug = newSlug; 
    }

    const productFields: Record<string, any> = {};
    const productParams: any[] = [];

    const addFieldToUpdate = (fieldName: string, value: any) => {
        if (value !== undefined) { 
            productFields[fieldName] = value === '' ? null : value;
        }
    };
    
    addFieldToUpdate('name', name);
    addFieldToUpdate('slug', effectiveSlug);
    addFieldToUpdate('game_slug', gameSlug); 
    addFieldToUpdate('status', status);
    
    addFieldToUpdate('image_url', image_url);
    addFieldToUpdate('status_text', status_text);
    addFieldToUpdate('short_description', short_description);
    addFieldToUpdate('long_description', long_description);
    addFieldToUpdate('data_ai_hint', data_ai_hint);
    addFieldToUpdate('mode', mode);
    addFieldToUpdate('gallery_image_urls', Array.isArray(gallery_image_urls) ? gallery_image_urls.join(',') : gallery_image_urls);
    
    addFieldToUpdate('functions_aim_title', functions_aim_title);
    addFieldToUpdate('functions_aim', functions_aim);
    addFieldToUpdate('functions_aim_description', functions_aim_description);
    addFieldToUpdate('functions_esp_title', functions_esp_title);
    addFieldToUpdate('functions_wallhack', functions_wallhack);
    addFieldToUpdate('functions_esp_description', functions_esp_description);
    addFieldToUpdate('functions_misc_title', functions_misc_title);
    addFieldToUpdate('functions_misc', functions_misc);
    addFieldToUpdate('functions_misc_description', functions_misc_description);

    addFieldToUpdate('system_os', system_os);
    addFieldToUpdate('system_build', system_build);
    addFieldToUpdate('system_gpu', system_gpu);
    addFieldToUpdate('system_cpu', system_cpu);
    addFieldToUpdate('price_text', price_text);

    addFieldToUpdate('retrieval_modal_intro_text', retrieval_modal_intro_text);
    addFieldToUpdate('retrieval_modal_antivirus_text', retrieval_modal_antivirus_text);
    addFieldToUpdate('retrieval_modal_antivirus_link_text', retrieval_modal_antivirus_link_text);
    addFieldToUpdate('retrieval_modal_antivirus_link_url', retrieval_modal_antivirus_link_url);
    addFieldToUpdate('retrieval_modal_launcher_text', retrieval_modal_launcher_text);
    addFieldToUpdate('retrieval_modal_launcher_link_text', retrieval_modal_launcher_link_text);
    addFieldToUpdate('retrieval_modal_launcher_link_url', retrieval_modal_launcher_link_url);
    addFieldToUpdate('retrieval_modal_key_paste_text', retrieval_modal_key_paste_text);
    addFieldToUpdate('retrieval_modal_support_text', retrieval_modal_support_text);
    addFieldToUpdate('retrieval_modal_support_link_text', retrieval_modal_support_link_text);
    addFieldToUpdate('retrieval_modal_support_link_url', retrieval_modal_support_link_url);
    addFieldToUpdate('retrieval_modal_how_to_run_link', retrieval_modal_how_to_run_link);

    addFieldToUpdate('activation_type', activation_type);
    addFieldToUpdate('loader_download_url', loader_download_url);
    addFieldToUpdate('info_modal_content_html', info_modal_content_html);
    addFieldToUpdate('info_modal_support_link_text', info_modal_support_link_text);
    addFieldToUpdate('info_modal_support_link_url', info_modal_support_link_url);


    if (Object.keys(productFields).length === 0 && (!pricing_options || pricing_options.length === (existingProduct.pricing_options || []).length)) {
      // More sophisticated check might be needed if pricing_options content changes without length change
      return NextResponse.json({ message: 'Нет данных для обновления товара.', product: existingProduct }, { status: 200 });
    }

    const setClauses = Object.keys(productFields).map(key => `${key} = ?`).join(', ');
    const finalProductParams = [...Object.values(productFields), targetProductId];

    const updateProductQuery = `UPDATE products SET ${setClauses}, updated_at = NOW() WHERE id = ?`;
    
    const productUpdateResult = await query(updateProductQuery, finalProductParams) as OkPacket | ResultSetHeader | any[];

    let affectedRows = 0;
    if (Array.isArray(productUpdateResult) && productUpdateResult.length > 0 && 'affectedRows' in productUpdateResult[0]) {
        affectedRows = productUpdateResult[0].affectedRows;
    } else if (productUpdateResult && 'affectedRows' in productUpdateResult) {
        affectedRows = (productUpdateResult as OkPacket).affectedRows;
    }
    
    await query('DELETE FROM product_pricing_options WHERE product_id = ?', [targetProductId]);
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
              targetProductId, duration_days, price_rub, price_gh, mode_label || null,
              is_rub_payment_visible === undefined ? true : Boolean(is_rub_payment_visible),
              is_gh_payment_visible === undefined ? true : Boolean(is_gh_payment_visible),
              custom_payment_1_label || null, custom_payment_1_price_rub || null, custom_payment_1_link || null, Boolean(custom_payment_1_is_visible),
              custom_payment_2_label || null, custom_payment_2_price_rub || null, custom_payment_2_link || null, Boolean(custom_payment_2_is_visible)
          ]
        );
      }
    }
    
    const updatedProductData = await getProductBySlugForUpdate(effectiveSlug); 

    return NextResponse.json({ message: 'Товар успешно обновлен', product: updatedProductData }, { status: 200 });

  } catch (error: any) {
    console.error(`API Admin Product PUT (slug: ${productSlug}) Error:`, error);
     if (error.code === 'ER_NO_REFERENCED_ROW_2' || (error.message && error.message.includes('foreign key constraint fails'))) {
        const submittedGameSlug = body?.game_slug ? String(body.game_slug).trim() : 'не указан';
        return NextResponse.json({ message: `Ошибка внешнего ключа: Убедитесь, что указанный 'game_slug' (${submittedGameSlug}) существует в таблице категорий (games).`, error_details: error.toString() }, { status: 400 });
    }
    return NextResponse.json({ message: `Internal Server Error: ${error.message}`, error_details: error.toString() }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const productSlug = params.slug ? String(params.slug).trim() : null;

  if (!productSlug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }

  try {
    const productToDelete = await getProductBySlugForUpdate(productSlug);
    if (!productToDelete || !productToDelete.id) {
        return NextResponse.json({ message: `Товар со slug '${productSlug}' не найден.` }, { status: 404 });
    }
    const productId = productToDelete.id; 

    const pricingOptions = await query('SELECT id FROM product_pricing_options WHERE product_id = ?', [productId]);
    const pricingOptionIds = pricingOptions.map((opt: { id: number }) => opt.id);

    if (pricingOptionIds.length > 0) {
      const placeholders = pricingOptionIds.map(() => '?').join(',');
      await query(`DELETE FROM purchases WHERE product_id = ? OR product_pricing_option_id IN (${placeholders})`, [productId, ...pricingOptionIds]);
      await query('DELETE FROM product_pricing_options WHERE product_id = ?', [productId]);
    } else {
      await query('DELETE FROM purchases WHERE product_id = ?', [productId]);
    }
    
    if (pricingOptionIds.length > 0) {
        const invPlaceholders = pricingOptionIds.map(() => '?').join(',');
        await query(`DELETE FROM user_inventory WHERE related_product_id = ? OR product_pricing_option_id IN (${invPlaceholders})`, [productId, ...pricingOptionIds]);
    } else {
        await query('DELETE FROM user_inventory WHERE related_product_id = ?', [productId]);
    }
    
    if (pricingOptionIds.length > 0) {
      const promoPlaceholders = pricingOptionIds.map(() => '?').join(',');
      await query(`DELETE FROM promo_codes WHERE related_product_id = ? OR product_pricing_option_id IN (${promoPlaceholders})`, [productId, ...pricingOptionIds]);
    } else {
      await query('DELETE FROM promo_codes WHERE related_product_id = ?', [productId]);
    }

    const result = await query('DELETE FROM products WHERE id = ?', [productId]) as OkPacket | ResultSetHeader | any[];
    
    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) {
        affectedRows = (result as OkPacket).affectedRows;
    }

    if (affectedRows > 0) {
      return NextResponse.json({ message: `Товар '${productSlug}' и связанные с ним записи успешно удалены.` }, { status: 200 });
    } else {
      return NextResponse.json({ message: `Товар '${productSlug}' не найден или уже был удален.` }, { status: 404 });
    }

  } catch (error: any) {
    console.error(`API Admin Product DELETE (slug: ${productSlug}) Error:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || (error.message && error.message.includes('foreign key constraint fails'))) {
        return NextResponse.json({ message: `Не удалось удалить товар: На товар '${productSlug}' ссылаются другие записи, которые не были автоматически очищены. Ошибка: ${error.message}`, error_details: error.toString() }, { status: 409 });
    }
    return NextResponse.json({ message: `Internal Server Error: ${error.message}`, error_details: error.toString() }, { status: 500 });
  }
}

// Ensure there's a newline at the very end of the file content.

