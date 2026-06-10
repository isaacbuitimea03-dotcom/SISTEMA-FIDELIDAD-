import { RewardOption, MerchantConfig } from '../types';

export const DEFAULT_MERCHANT_CONFIG: MerchantConfig = {
  pin: '1234',
  shopName: 'Mi Cafecito',
  brandColor: '#149b8f', // Base 44 Teal Green
  stampsRequired: 8,
  mainRewardTitle: '20% de Descuento'
};

export const REWARD_OPTIONS: RewardOption[] = [
  {
    id: 'caf_01',
    title: 'Café de Especialidad',
    description: 'Espresso, Latte o Capuccino hecho con granos de origen único, acompañado de una galleta casera.',
    costInPoints: 150,
    costInStamps: 2,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'des_01',
    title: 'Rebanada de Tarta Gourmet',
    description: 'Postre artesanal a elección: cheesecake de frutos rojos o tarta de chocolate amargo.',
    costInPoints: 300,
    costInStamps: 4,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400'
  } ,
  {
    id: 'pla_01',
    title: 'Hamburguesa La Estancia',
    description: 'Nuestra hamburguesa insignia de res madurada con queso cheddar fundido, tocino crujiente y papas rústicas.',
    costInPoints: 600,
    costInStamps: 6,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'com_01',
    title: 'Menú del Día Completo',
    description: 'Plato fuerte, entrada del chef, postre individual y bebida refrescante de temporada.',
    costInPoints: 800,
    costInStamps: 8,
    category: 'special',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400'
  }
];
