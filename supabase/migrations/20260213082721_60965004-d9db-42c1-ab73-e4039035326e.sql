UPDATE public.app_settings SET vacation_mode_message = 'You may contact us to further discuss about this product.' WHERE vacation_mode_message = 'Orders are temporarily paused. Please check back later.';

ALTER TABLE public.app_settings ALTER COLUMN vacation_mode_message SET DEFAULT 'You may contact us to further discuss about this product.';