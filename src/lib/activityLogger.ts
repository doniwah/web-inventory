import { supabase } from './supabase';

type ActivityType = 'stock_in' | 'stock_out' | 'adjustment' | 'price_change' | 'product_create' | 'bundle_create';

export const logActivity = async (
  type: ActivityType,
  description: string,
  userId?: string
) => {
  try {
    console.log('📝 Logging activity:', { type, description, userId });
    
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([
        {
          type,
          aktivitas: description,
          user_id: userId || null,
        },
      ])
      .select();

    if (error) {
      console.error('❌ Error logging activity:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Activity logged successfully:', data);
    }
  } catch (error) {
    console.error('❌ Exception logging activity:', error);
  }
};
