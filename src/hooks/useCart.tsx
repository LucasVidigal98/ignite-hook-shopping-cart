import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productInCart = cart.find(product => product.id === productId);
      const productStockResponse:Stock = await (await api.get(`/stock/${productId}`)).data;

      if (productInCart) {
        if (productStockResponse.amount - (productInCart.amount + 1) >= 0) {
          updateProductAmount({ productId, amount: productInCart.amount + 1 });
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        const productResponse:Product = await (await api.get(`/products/${productId}`)).data;
        const product = productResponse;

        if (productStockResponse.amount > 0) {
          const newCart = [...cart, { ...product, amount: 1 }];
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          toast.success('Produto adicionado com sucesso');
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(product => product.id === productId);

      if (product) {
        const newCart = cart.filter(product => product.id !== productId);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        toast.success('Produto removido com sucesso');
      } else {
        toast.error('Erro na remoção do produto');
      }

    } catch(error) {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0 ) return;

      const product = cart.find(product => product.id === productId);
      const productStockResponse: Stock = await (await api.get(`/stock/${productId}`)).data;
      if (product) {
        if (productStockResponse.amount - amount >= 0) {
          const newCart = cart.map(product => {
            if (product.id === productId) {
              product.amount = amount;
              return product;
            }
            return product;
          });
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        toast.error('Erro na atualização do produto');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
