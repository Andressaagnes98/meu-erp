'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  Trash2, 
  Minus, 
  CreditCard, 
  User as UserIcon,
  Package,
  Clock,
  XCircle
} from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  stock_quantity: number;
  image_url: string;
}

interface CartItem extends Product {
  quantity: number;
}

export function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();

    // Set up real-time listener
    const channel = supabase
      .channel('pos-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) console.error('Error fetching products:', error);
    else setProducts(data || []);
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        const product = products.find(p => p.id === productId);
        if (product && newQty > product.stock_quantity) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (Number(item.selling_price) * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      // 1. Create sale record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{ total_amount: total }])
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Create sale items
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.selling_price
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // 3. Update stock for each product
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: item.stock_quantity - item.quantity })
          .eq('id', item.id);
        
        if (stockError) throw stockError;
      }

      setCart([]);
      alert('Venda realizada com sucesso!');
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Erro ao processar venda.');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full bg-slate-50">
      {/* Products Section */}
      <div className="flex-1 p-8 overflow-hidden flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-slate-800">Ponto de Venda</h1>
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar produtos ou categorias..."
              className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock_quantity <= 0}
                  className={`group bg-white p-4 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 text-left relative overflow-hidden border border-transparent hover:border-blue-100 ${
                    product.stock_quantity <= 0 ? 'opacity-60 grayscale' : ''
                  }`}
                >
                  <div className="aspect-square rounded-2xl bg-slate-50 mb-4 overflow-hidden relative">
                    {product.image_url ? (
                      <Image 
                        src={product.image_url} 
                        alt={product.name} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                    {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
                        Baixo Estoque
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{product.category}</p>
                    <h3 className="font-black text-slate-800 truncate">{product.name}</h3>
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xl font-black text-slate-900">
                        R$ {Number(product.selling_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs font-bold text-slate-400">{product.stock_quantity} un</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-[450px] bg-white border-l border-slate-200 flex flex-col shadow-2xl">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <ShoppingCart className="w-7 h-7 text-blue-600" />
              Carrinho
            </h2>
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-black">
              {cart.length} itens
            </span>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">Cliente Consumidor</p>
              <p className="text-xs text-slate-500">0 pontos acumulados</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
              <ShoppingCart className="w-16 h-16" />
              <p className="font-bold">Seu carrinho está vazio</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden relative flex-shrink-0">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.name} fill className="object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate">{item.name}</h4>
                  <p className="text-sm font-black text-blue-600">
                    R$ {Number(item.selling_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4 text-slate-400" />
                    </button>
                    <span className="font-black text-slate-700 w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-slate-500 font-bold">
              <span>Subtotal</span>
              <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-bold">
              <span>Desconto</span>
              <span className="text-green-600">- R$ 0,00</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-slate-800 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
              <Clock className="w-5 h-5" />
              Aguardar
            </button>
            <button className="py-4 bg-white border-2 border-red-100 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all">
              <XCircle className="w-5 h-5" />
              Cancelar
            </button>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
          >
            <CreditCard className="w-6 h-6" />
            Finalizar Venda
          </button>
        </div>
      </div>
    </div>
  );
}
