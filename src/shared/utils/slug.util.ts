/**
 * Generate slug from text (Vietnamese-friendly)
 * Converts text to URL-friendly slug format
 * 
 * @param text - The text to convert to slug
 * @returns URL-friendly slug
 * 
 * @example
 * generateSlug("Áo Thun Đẹp") // returns "ao-thun-dep"
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a')
        .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
        .replace(/[íìỉĩị]/g, 'i')
        .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
        .replace(/[úùủũụưứừửữự]/g, 'u')
        .replace(/[ýỳỷỹỵ]/g, 'y')
        .replace(/[đ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Generate unique slug with random suffix
 * Adds a random 6-digit number to ensure uniqueness
 * 
 * @param text - The text to convert to slug
 * @returns URL-friendly slug with random suffix
 * 
 * @example
 * generateUniqueSlug("Áo Thun") // returns "ao-thun-123456"
 */
export function generateUniqueSlug(text: string): string {
    const baseSlug = generateSlug(text);
    const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    return `${baseSlug}-${randomSuffix}`;
}

/**
 * Generate slug with custom suffix
 * Useful when you want to append specific identifier
 * 
 * @param text - The text to convert to slug
 * @param suffix - Custom suffix to append
 * @returns URL-friendly slug with custom suffix
 * 
 * @example
 * generateSlugWithSuffix("Áo Thun", "123") // returns "ao-thun-123"
 */
export function generateSlugWithSuffix(text: string, suffix: string | number): string {
    const baseSlug = generateSlug(text);
    return `${baseSlug}-${suffix}`;
}

