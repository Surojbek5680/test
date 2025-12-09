import React, { useState, useEffect } from 'react';
import { User, Requisition, UserRole, RequestStatus, Product, StockTransaction } from './types';
import { INITIAL_REQUESTS, MOCK_USERS, PRODUCTS, BLOOD_GROUPS } from './constants';
import { Layout } from './components/Layout';
import { analyzeStatistics } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Check, X, Clock, Loader2, Sparkles, AlertCircle, PlusCircle, Trash2, Building, Key, User as UserIcon, Pencil, Save, Package, Scale, Download, ListFilter, Droplet, Eye, EyeOff, Settings, Send, Warehouse, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// --- TYPES LOCAL ---
interface TelegramConfig {
  botToken: string;
  chatId: string;
}

// --- COMPONENTS DEFINED INTERNALLY ---

// 1. LOGIN PAGE
const LoginPage = ({ onLogin }: { onLogin: (u: string, p: string) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Iltimos, barcha maydonlarni to\'ldiring.');
      return;
    }
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Taminot<span className="text-blue-600">Manager</span></h1>
          <p className="text-slate-500 mt-2">Tizimga kirish</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
              <AlertCircle size={16} className="mr-2" /> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Login</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parol</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg"
          >
            Kirish
          </button>
        </form>
      </div>
    </div>
  );
};

// 1.1 EDIT REQUEST MODAL
const EditRequestModal = ({ 
  request, 
  products,
  onClose, 
  onSave 
}: { 
  request: Requisition, 
  products: Product[],
  onClose: () => void, 
  onSave: (r: Requisition) => void 
}) => {
  const [quantity, setQuantity] = useState(request.quantity);
  const [productId, setProductId] = useState(request.productId);
  const [variant, setVariant] = useState(request.variant || '');
  const [bloodGroup, setBloodGroup] = useState(request.bloodGroup || BLOOD_GROUPS[0]);
  const [comment, setComment] = useState(request.comment || '');

  const selectedProductObj = products.find(p => p.id === productId);

  // Update variant when product changes
  useEffect(() => {
    if (selectedProductObj && selectedProductObj.variants && selectedProductObj.variants.length > 0) {
      if (!selectedProductObj.variants.includes(variant)) {
        setVariant(selectedProductObj.variants[0]);
      }
    } else {
      setVariant('');
    }
  }, [productId, products]);

  const handleSave = () => {
    if (!selectedProductObj) return;

    onSave({
      ...request,
      quantity: Number(quantity),
      productId: selectedProductObj.id,
      productName: selectedProductObj.name,
      unit: selectedProductObj.unit,
      variant: variant,
      bloodGroup: bloodGroup,
      comment
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Talabnomani Tahrirlash</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {selectedProductObj?.variants && selectedProductObj.variants.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hajmi/Turi</label>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                >
                  {selectedProductObj.variants.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            ) : (
                <div className="flex items-end pb-2 text-sm text-slate-400">Variantlar yo'q</div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Qon Guruhi</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
              >
                {BLOOD_GROUPS.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Soni (Count)</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Izoh</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition">Bekor qilish</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
            <Save size={16} className="mr-2" /> Saqlash
          </button>
        </div>
      </div>
    </div>
  );
};

// 1.2 EDIT USER MODAL
const EditUserModal = ({ 
  user, 
  onClose, 
  onSave 
}: { 
  user: User, 
  onClose: () => void, 
  onSave: (u: User) => void 
}) => {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState(user.password || '');

  const handleSave = () => {
    if (!name || !username || !password) return;
    onSave({
      ...user,
      name,
      username,
      password
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Tashkilot Ma'lumotlarini Tahrirlash</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tashkilot Nomi</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Login</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parol (Yangilash)</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Yangi parol"
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition">Bekor qilish</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
            <Save size={16} className="mr-2" /> Saqlash
          </button>
        </div>
      </div>
    </div>
  );
};

// 1.3 EDIT PRODUCT MODAL
const EditProductModal = ({ 
  product, 
  onClose, 
  onSave 
}: { 
  product: Product, 
  onClose: () => void, 
  onSave: (p: Product) => void 
}) => {
  const [name, setName] = useState(product.name);
  const [unit, setUnit] = useState(product.unit);
  const [variants, setVariants] = useState(product.variants ? product.variants.join(', ') : '');

  const handleSave = () => {
    if (!name || !unit) return;
    onSave({
      ...product,
      name,
      unit,
      variants: variants.trim() ? variants.split(',').map(v => v.trim()) : []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Mahsulotni Tahrirlash</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot Nomi</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">O'lchov Birligi</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Variantlar (vergul bilan ajratilgan)</label>
            <input
              type="text"
              value={variants}
              onChange={(e) => setVariants(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0.200, 0.250"
            />
            <p className="text-xs text-slate-400 mt-1">Masalan: 0.200, 0.250 (agar variant bo'lmasa bo'sh qoldiring)</p>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition">Bekor qilish</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
            <Save size={16} className="mr-2" /> Saqlash
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. ADMIN DASHBOARD
const AdminDashboard = ({ 
  requests, 
  products,
  onUpdateStatus,
  onDeleteRequest,
  onEditRequest
}: { 
  requests: Requisition[], 
  products: Product[],
  onUpdateStatus: (id: string, status: RequestStatus) => void,
  onDeleteRequest: (id: string) => void,
  onEditRequest: (req: Requisition) => void
}) => {
  const [editingItem, setEditingItem] = useState<Requisition | null>(null);

  const pendingRequests = requests.filter(r => r.status === RequestStatus.PENDING).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const historyRequests = requests.filter(r => r.status !== RequestStatus.PENDING).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const openEdit = (req: Requisition) => {
    setEditingItem(req);
  };

  const handleSaveEdit = (updatedReq: Requisition) => {
    onEditRequest(updatedReq);
    setEditingItem(null);
  };

  return (
    <div className="space-y-8">
      {editingItem && (
        <EditRequestModal 
          request={editingItem} 
          products={products}
          onClose={() => setEditingItem(null)} 
          onSave={handleSaveEdit} 
        />
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Kelib tushgan talabnomalar</h2>
        {pendingRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center text-slate-500">
            Hozircha yangi talabnomalar mavjud emas.
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between hover:shadow-md transition group">
                <div className="mb-4 lg:mb-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg text-slate-800">{req.orgName}</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Kutilmoqda</span>
                  </div>
                  <div className="text-slate-600 mt-2 flex flex-col space-y-1">
                    <div className="flex items-center">
                      <span className="font-semibold text-blue-600">{req.productName}</span>
                      {req.variant && <span className="text-slate-500 ml-2 bg-slate-100 px-2 rounded-md text-sm">{req.variant}</span>}
                    </div>
                    {req.bloodGroup && (
                      <div className="flex items-center text-red-600 font-medium">
                        <Droplet size={14} className="mr-1 fill-current" />
                        Guruh: {req.bloodGroup}
                      </div>
                    )}
                    <div className="text-sm">
                      Soni: <span className="font-bold text-slate-900">{req.quantity} ta</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 flex items-center">
                    <Clock size={12} className="mr-1" /> {new Date(req.date).toLocaleString('uz-UZ')}
                  </p>
                  {req.comment && <p className="text-sm text-slate-500 mt-2 italic bg-slate-50 p-2 rounded border border-slate-100 inline-block">"{req.comment}"</p>}
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                   <button
                    onClick={() => openEdit(req)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Tahrirlash"
                  >
                    <Pencil size={18} />
                  </button>
                   <button
                    onClick={() => onDeleteRequest(req.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="O'chirish"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="w-px h-8 bg-slate-200 mx-2 hidden lg:block"></div>
                  <button
                    onClick={() => onUpdateStatus(req.id, RequestStatus.APPROVED)}
                    className="flex-1 lg:flex-none flex items-center justify-center space-x-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 transition"
                  >
                    <Check size={16} /> <span>Tasdiqlash</span>
                  </button>
                  <button
                    onClick={() => onUpdateStatus(req.id, RequestStatus.REJECTED)}
                    className="flex-1 lg:flex-none flex items-center justify-center space-x-1 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition"
                  >
                    <X size={16} /> <span>Rad etish</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Tarix va Barcha Talabnomalar</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500">Tashkilot</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Mahsulot</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Hajmi/Turi</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Qon Guruhi</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Soni</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Sana</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Holat</th>
                  <th className="px-6 py-3 font-medium text-slate-500 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-medium">{req.orgName}</td>
                    <td className="px-6 py-3">{req.productName}</td>
                    <td className="px-6 py-3">{req.variant ? `${req.variant} ${req.unit}` : '-'}</td>
                    <td className="px-6 py-3">
                      <span className="font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs border border-red-100">
                        {req.bloodGroup || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-semibold">{req.quantity} ta</td>
                    <td className="px-6 py-3 text-slate-500">{new Date(req.date).toLocaleDateString('uz-UZ')}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        req.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' :
                        req.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status === RequestStatus.APPROVED ? 'Tasdiqlandi' : 
                         req.status === RequestStatus.REJECTED ? 'Rad etildi' : 'Kutilmoqda'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button 
                        onClick={() => openEdit(req)}
                        className="text-slate-400 hover:text-blue-600 transition"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteRequest(req.id)}
                        className="text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2.1 ADMIN WAREHOUSE
const AdminWarehouse = ({
  users,
  products,
  stockTransactions,
  onAddStock
}: {
  users: User[],
  products: Product[],
  stockTransactions: StockTransaction[],
  onAddStock: (productId: string, variant: string, quantity: number, comment: string) => void
}) => {
  const [activeTab, setActiveTab] = useState<'central' | 'orgs'>('central');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  
  // Existing state for Central Add Stock
  const [selectedProduct, setSelectedProduct] = useState(products.length > 0 ? products[0].id : '');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [comment, setComment] = useState('');
  
  // Calculate current stock for ADMIN
  const currentStock: Record<string, number> = {};
  
  stockTransactions.filter(tx => tx.orgId === 'admin').forEach(tx => {
    const key = `${tx.productId}-${tx.variant || 'default'}`;
    if (!currentStock[key]) currentStock[key] = 0;
    
    if (tx.type === 'IN') {
      currentStock[key] += tx.quantity;
    } else {
      currentStock[key] -= tx.quantity;
    }
  });

  // Calculate stock for Selected Org
  const orgStock: Record<string, number> = {};
  if (activeTab === 'orgs' && selectedOrgId) {
     stockTransactions.filter(tx => tx.orgId === selectedOrgId).forEach(tx => {
        const key = `${tx.productId}-${tx.variant || 'default'}`;
        if (!orgStock[key]) orgStock[key] = 0;
        
        if (tx.type === 'IN') {
          orgStock[key] += tx.quantity;
        } else {
          orgStock[key] -= tx.quantity;
        }
     });
  }

  // When product changes, reset/set default variant
  useEffect(() => {
    const product = products.find(p => p.id === selectedProduct);
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant('');
    }
  }, [selectedProduct, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;
    
    onAddStock(selectedProduct, selectedVariant, Number(quantity), comment);
    setQuantity(0);
    setComment('');
  };

  const currentProduct = products.find(p => p.id === selectedProduct);
  const orgUsers = users.filter(u => u.role === UserRole.ORG);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
          <button 
              onClick={() => setActiveTab('central')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'central' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
              Markaziy Ombor
          </button>
          <button 
               onClick={() => setActiveTab('orgs')}
               className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'orgs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
              Tashkilotlar Ombori (Monitoring)
          </button>
      </div>

      {activeTab === 'central' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Omborxona (Markaziy): Kirim qilish</h2>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-1">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Hajmi / Turi</label>
                   {currentProduct?.variants && currentProduct.variants.length > 0 ? (
                      <select
                        value={selectedVariant}
                        onChange={(e) => setSelectedVariant(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {currentProduct.variants.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        disabled 
                        value="Variant mavjud emas" 
                        className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 text-slate-400 rounded-lg"
                      />
                    )}
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Miqdor (Kirim)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow flex items-center justify-center space-x-2"
                >
                  <ArrowDownLeft size={18} />
                  <span>Kirim Qilish</span>
                </button>
              </form>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Ombor Qoldig'i (Jami)</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium text-slate-500">Mahsulot Nomi</th>
                    <th className="px-6 py-4 font-medium text-slate-500">Hajmi / Variant</th>
                    <th className="px-6 py-4 font-medium text-slate-500">Mavjud Qoldiq</th>
                    <th className="px-6 py-4 font-medium text-slate-500">O'lchov Birligi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {products.length === 0 && (
                     <tr><td colSpan={4} className="p-6 text-center text-slate-400">Mahsulotlar yo'q</td></tr>
                   )}
                   {products.map(p => {
                      if (p.variants && p.variants.length > 0) {
                        return p.variants.map(v => {
                           const key = `${p.id}-${v}`;
                           const qty = currentStock[key] || 0;
                           return (
                             <tr key={key} className="hover:bg-slate-50">
                               <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                               <td className="px-6 py-4 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{v}</span></td>
                               <td className="px-6 py-4 font-bold text-blue-600">{qty}</td>
                               <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                             </tr>
                           )
                        });
                      } else {
                         const key = `${p.id}-default`;
                         const qty = currentStock[key] || 0;
                         return (
                            <tr key={key} className="hover:bg-slate-50">
                               <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                               <td className="px-6 py-4 text-slate-400 italic">-</td>
                               <td className="px-6 py-4 font-bold text-blue-600">{qty}</td>
                               <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                             </tr>
                         )
                      }
                   })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
         <div className="space-y-8 animate-in fade-in duration-300">
            <div>
               <h2 className="text-2xl font-bold text-slate-800 mb-6">Tashkilotlar Ombori Monitoringi</h2>
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
                 <label className="block text-sm font-medium text-slate-700 mb-2">Tashkilotni tanlang</label>
                 <select 
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full md:w-1/2 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                 >
                     <option value="">-- Tashkilotni tanlang --</option>
                     {orgUsers.map(u => (
                         <option key={u.id} value={u.id}>{u.name}</option>
                     ))}
                 </select>
               </div>

               {selectedOrgId ? (
                 <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                       <h3 className="font-bold text-slate-800 flex items-center">
                          <Building className="mr-2 text-blue-600" size={18} />
                          {users.find(u => u.id === selectedOrgId)?.name}
                       </h3>
                    </div>
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 border-b border-slate-200">
                         <tr>
                           <th className="px-6 py-4 font-medium text-slate-500">Mahsulot Nomi</th>
                           <th className="px-6 py-4 font-medium text-slate-500">Hajmi / Variant</th>
                           <th className="px-6 py-4 font-medium text-slate-500">Qoldiq (Tashkilotda)</th>
                           <th className="px-6 py-4 font-medium text-slate-500">O'lchov Birligi</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {products.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-slate-400">Mahsulotlar yo'q</td></tr>
                          )}
                          {products.map(p => {
                             if (p.variants && p.variants.length > 0) {
                               return p.variants.map(v => {
                                  const key = `${p.id}-${v}`;
                                  const qty = orgStock[key] || 0;
                                  return (
                                    <tr key={key} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                                      <td className="px-6 py-4 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{v}</span></td>
                                      <td className={`px-6 py-4 font-bold ${qty > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{qty}</td>
                                      <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                                    </tr>
                                  )
                               });
                             } else {
                                const key = `${p.id}-default`;
                                const qty = orgStock[key] || 0;
                                return (
                                   <tr key={key} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                                      <td className="px-6 py-4 text-slate-400 italic">-</td>
                                      <td className={`px-6 py-4 font-bold ${qty > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{qty}</td>
                                      <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                                    </tr>
                                )
                             }
                          })}
                          {Object.values(orgStock).every(q => q === 0) && (
                            <tr><td colSpan={4} className="p-6 text-center text-slate-400">Bu tashkilotda mahsulot qoldig'i mavjud emas</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                    Ma'lumotlarni ko'rish uchun yuqorida tashkilotni tanlang
                 </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

// 3. ADMIN STATISTICS
const AdminStats = ({ requests, users }: { requests: Requisition[], users: User[] }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  const orgUsers = users.filter(u => u.role === UserRole.ORG);

  // Filter requests based on selected Org
  const filteredRequests = selectedOrgId 
    ? requests.filter(r => r.orgId === selectedOrgId) 
    : requests;

  // Filter only approved for valid stats
  const approved = filteredRequests.filter(r => r.status === RequestStatus.APPROVED);

  // Data preparation for charts
  const productCount: Record<string, number> = {};
  const orgCount: Record<string, number> = {};

  approved.forEach(req => {
    // Combine name and variant for chart label
    let label = req.productName;
    if (req.variant) label += ` (${req.variant})`;
    
    productCount[label] = (productCount[label] || 0) + req.quantity;
    orgCount[req.orgName] = (orgCount[req.orgName] || 0) + 1;
  });

  const productData = Object.keys(productCount).map(name => ({ name, value: productCount[name] }));
  const orgData = Object.keys(orgCount).map(name => ({ name, requests: orgCount[name] }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeStatistics(filteredRequests);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const orgName = selectedOrgId ? users.find(u => u.id === selectedOrgId)?.name : "Barcha Tashkilotlar";

    // Title
    doc.setFontSize(18);
    doc.text("TaminotManager - Statistik Hisobot", 14, 22);

    doc.setFontSize(11);
    doc.text(`Sana: ${new Date().toLocaleDateString('uz-UZ')}`, 14, 30);
    doc.text(`Tashkilot: ${orgName || 'Jami'}`, 14, 38);

    // Data preparation
    const productRows = approved.map(r => [
      r.orgName,
      r.productName,
      r.variant || '-',
      r.bloodGroup || '-',
      r.quantity,
      new Date(r.date).toLocaleDateString('uz-UZ')
    ]);

    // Detail Table
    doc.text("Tasdiqlangan Talabnomalar Ro'yxati", 14, 48);
    autoTable(doc, {
        startY: 52,
        head: [['Tashkilot', 'Mahsulot', 'Hajmi', 'Guruh', 'Soni', 'Sana']],
        body: productRows,
    });

    const lastY = (doc as any).lastAutoTable.finalY || 50;

    // Summary Org Table
    if (!selectedOrgId) {
        const orgRows = orgData.map(o => [o.name, o.requests]);
        doc.text("Tashkilotlar faolligi", 14, lastY + 15);

        autoTable(doc, {
            startY: lastY + 20,
            head: [['Tashkilot', 'Talabnomalar Soni']],
            body: orgRows,
        });
    }

    doc.save("taminot_hisobot.pdf");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Statistika va Hisobotlar</h2>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Filter Dropdown */}
            <div className="relative flex-grow md:flex-grow-0">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={16} className="text-slate-400" />
               </div>
               <select 
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 appearance-none bg-white cursor-pointer"
               >
                  <option value="">Barcha Tashkilotlar</option>
                  {orgUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
               </select>
            </div>

            <button 
                onClick={handleExportPDF}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition text-sm"
            >
                <Download size={18} />
                <span>PDF</span>
            </button>
            <button 
                onClick={handleAiAnalysis}
                disabled={loadingAi}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition disabled:opacity-50 text-sm"
            >
                {loadingAi ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                <span>AI Tahlil</span>
            </button>
        </div>
      </div>

      {aiAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100">
          <h3 className="text-lg font-bold text-purple-800 mb-2 flex items-center"><Sparkles size={18} className="mr-2"/> Gemini AI Xulosasi</h3>
          <div className="prose prose-sm text-slate-700 max-w-none">
             <pre className="whitespace-pre-wrap font-sans text-sm">{aiAnalysis}</pre>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-700 mb-6">Mahsulotlar Kesimida (Soni)</h3>
          {productData.length > 0 ? (
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={productData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    >
                    {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">Ma'lumot yo'q</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-700 mb-6">Tashkilotlar Faolligi (Talabnomalar soni)</h3>
          {orgData.length > 0 ? (
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">Ma'lumot yo'q</div>
          )}
        </div>
      </div>
    </div>
  );
};

// 3.1 ORG WAREHOUSE (NEW)
const OrgWarehouse = ({
  user,
  products,
  stockTransactions,
  onAddTransaction
}: {
  user: User,
  products: Product[],
  stockTransactions: StockTransaction[],
  onAddTransaction: (productId: string, variant: string, quantity: number, comment: string) => void
}) => {
  const [selectedProduct, setSelectedProduct] = useState(products.length > 0 ? products[0].id : '');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [comment, setComment] = useState('');
  
  // Calculate current stock for THIS ORG
  const currentStock: Record<string, number> = {};
  
  stockTransactions.filter(tx => tx.orgId === user.id).forEach(tx => {
    const key = `${tx.productId}-${tx.variant || 'default'}`;
    if (!currentStock[key]) currentStock[key] = 0;
    
    if (tx.type === 'IN') {
      currentStock[key] += tx.quantity;
    } else {
      currentStock[key] -= tx.quantity;
    }
  });

  // When product changes, reset/set default variant
  useEffect(() => {
    const product = products.find(p => p.id === selectedProduct);
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant('');
    }
  }, [selectedProduct, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;
    
    // Org uses item -> OUT transaction
    onAddTransaction(selectedProduct, selectedVariant, Number(quantity), comment);
    setQuantity(0);
    setComment('');
  };

  const currentProduct = products.find(p => p.id === selectedProduct);

  return (
    <div className="space-y-8">
       <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Ombor Qoldig'i (Bizning Tashkilot)</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-500">Mahsulot Nomi</th>
                <th className="px-6 py-4 font-medium text-slate-500">Hajmi / Variant</th>
                <th className="px-6 py-4 font-medium text-slate-500">Mavjud Qoldiq</th>
                <th className="px-6 py-4 font-medium text-slate-500">O'lchov Birligi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {products.length === 0 && (
                 <tr><td colSpan={4} className="p-6 text-center text-slate-400">Mahsulotlar yo'q</td></tr>
               )}
               {products.map(p => {
                  if (p.variants && p.variants.length > 0) {
                    return p.variants.map(v => {
                       const key = `${p.id}-${v}`;
                       const qty = currentStock[key] || 0;
                       if (qty === 0) return null; // Only show items they actually have
                       return (
                         <tr key={key} className="hover:bg-slate-50">
                           <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                           <td className="px-6 py-4 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{v}</span></td>
                           <td className="px-6 py-4 font-bold text-blue-600">{qty}</td>
                           <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                         </tr>
                       )
                    });
                  } else {
                     const key = `${p.id}-default`;
                     const qty = currentStock[key] || 0;
                     if (qty === 0) return null;
                     return (
                        <tr key={key} className="hover:bg-slate-50">
                           <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                           <td className="px-6 py-4 text-slate-400 italic">-</td>
                           <td className="px-6 py-4 font-bold text-blue-600">{qty}</td>
                           <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                         </tr>
                     )
                  }
               })}
               {Object.values(currentStock).every(val => val === 0) && (
                 <tr><td colSpan={4} className="p-6 text-center text-slate-400">Omborda mahsulot yo'q. (Tasdiqlangan talabnomalar avtomatik kirim qilinadi)</td></tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Ishlatilgan Mahsulotni Kiritish (Chiqim)</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
             <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
               <label className="block text-sm font-medium text-slate-700 mb-1">Hajmi / Turi</label>
               {currentProduct?.variants && currentProduct.variants.length > 0 ? (
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {currentProduct.variants.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    disabled 
                    value="Variant mavjud emas" 
                    className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 text-slate-400 rounded-lg"
                  />
                )}
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Miqdor (Ishlatildi)</label>
              <input
                type="number"
                min="1"
                value={quantity || ''}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0"
              />
            </div>

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow flex items-center justify-center space-x-2"
            >
              <ArrowUpRight size={18} />
              <span>Chiqim Qilish</span>
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2">Izoh: Bu faqat sizning ichki hisobingiz uchun. Admin omboriga ta'sir qilmaydi.</p>
        </div>
      </div>
    </div>
  );
};

// 3.2 ORG STATISTICS (NEW)
const OrgStats = ({ requests }: { requests: Requisition[] }) => {
  // Only use requests for THIS ORG (already filtered by parent)
  const approved = requests.filter(r => r.status === RequestStatus.APPROVED);

  const productCount: Record<string, number> = {};
  
  approved.forEach(req => {
    let label = req.productName;
    if (req.variant) label += ` (${req.variant})`;
    productCount[label] = (productCount[label] || 0) + req.quantity;
  });

  const productData = Object.keys(productCount).map(name => ({ name, value: productCount[name] }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800">Mening Statistikam</h2>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-slate-700 mb-6">Olingan Mahsulotlar (Soni)</h3>
         {productData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
         ) : (
             <div className="text-center text-slate-400 py-10">Hozircha ma'lumot yo'q</div>
         )}
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
         <h3 className="text-lg font-bold text-slate-700 mb-4">Umumiy Ma'lumot</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-blue-50 p-4 rounded-lg">
                 <p className="text-sm text-slate-500">Jami Talabnomalar</p>
                 <p className="text-2xl font-bold text-blue-600">{requests.length} ta</p>
             </div>
             <div className="bg-green-50 p-4 rounded-lg">
                 <p className="text-sm text-slate-500">Tasdiqlangan</p>
                 <p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === RequestStatus.APPROVED).length} ta</p>
             </div>
             <div className="bg-yellow-50 p-4 rounded-lg">
                 <p className="text-sm text-slate-500">Kutilmoqda</p>
                 <p className="text-2xl font-bold text-yellow-600">{requests.filter(r => r.status === RequestStatus.PENDING).length} ta</p>
             </div>
         </div>
      </div>
    </div>
  );
};

// 4. ORGANIZATION MANAGEMENT
const AdminUsers = ({ 
  users, 
  requests,
  onAddUser, 
  onUpdateUser,
  onDeleteUser 
}: { 
  users: User[], 
  requests: Requisition[],
  onAddUser: (u: User) => void,
  onUpdateUser: (u: User) => void,
  onDeleteUser: (id: string) => void
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // States for visibility and editing
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const orgUsers = users.filter(u => u.role === UserRole.ORG);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }
    
    // Check for duplicate username
    if (users.some(u => u.username === username)) {
      setError("Bu login band");
      return;
    }

    const newUser: User = {
      id: `org-${Date.now()}`,
      name,
      username,
      password,
      role: UserRole.ORG
    };

    onAddUser(newUser);
    setName('');
    setUsername('');
    setPassword('');
    setError('');
  };

  const togglePasswordVisibility = (id: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVisiblePasswords(newSet);
  };

  const handleSaveEdit = (updatedUser: User) => {
    onUpdateUser(updatedUser);
    setEditingUser(null);
  };

  return (
    <div className="space-y-8">
      {editingUser && (
        <EditUserModal 
          user={editingUser} 
          onClose={() => setEditingUser(null)} 
          onSave={handleSaveEdit} 
        />
      )}

      {/* Create New Org */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Yangi Tashkilot Qo'shish</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tashkilot Nomi</label>
              <div className="relative">
                <Building size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Masalan: 5-Maktab"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Login</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="login123"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Parol</label>
              <div className="relative">
                <Key size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow flex items-center justify-center space-x-2"
            >
              <PlusCircle size={18} />
              <span>Qo'shish</span>
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>
      </div>

      {/* List Existing Orgs */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Mavjud Tashkilotlar ({orgUsers.length})</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-500">Tashkilot Nomi</th>
                <th className="px-6 py-4 font-medium text-slate-500">Login</th>
                <th className="px-6 py-4 font-medium text-slate-500">Parol</th>
                <th className="px-6 py-4 font-medium text-slate-500">Faollik</th>
                <th className="px-6 py-4 font-medium text-slate-500 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orgUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Tashkilotlar ro'yxati bo'sh
                  </td>
                </tr>
              ) : (
                orgUsers.map((u) => {
                  const reqCount = requests.filter(r => r.orgId === u.id).length;
                  const isPasswordVisible = visiblePasswords.has(u.id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium text-slate-800">{u.name}</td>
                      <td className="px-6 py-4 text-slate-600">{u.username}</td>
                      <td className="px-6 py-4 text-slate-600 flex items-center space-x-2">
                        <span className="font-mono">{isPasswordVisible ? u.password : '••••••'}</span>
                        <button 
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="text-slate-400 hover:text-blue-600 transition"
                          title={isPasswordVisible ? "Yashirish" : "Ko'rsatish"}
                        >
                          {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                           {reqCount} ta talabnoma
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                           <button 
                            onClick={() => setEditingUser(u)}
                            className="text-slate-500 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition"
                            title="Tahrirlash / Parolni tiklash"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => onDeleteUser(u.id)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                            title="O'chirish"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 4.1 PRODUCT MANAGEMENT
const AdminProducts = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: {
  products: Product[],
  onAddProduct: (p: Product) => void,
  onUpdateProduct: (p: Product) => void,
  onDeleteProduct: (id: string) => void
}) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [variants, setVariants] = useState('');
  const [error, setError] = useState('');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !unit) {
      setError("Mahsulot nomi va o'lchov birligini kiriting");
      return;
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      unit,
      variants: variants.trim() ? variants.split(',').map(v => v.trim()) : []
    };

    onAddProduct(newProduct);
    setName('');
    setUnit('');
    setVariants('');
    setError('');
  };

  const handleSaveEdit = (updatedProduct: Product) => {
    onUpdateProduct(updatedProduct);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-8">
      {editingProduct && (
        <EditProductModal 
          product={editingProduct} 
          onClose={() => setEditingProduct(null)} 
          onSave={handleSaveEdit} 
        />
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Yangi Mahsulot Qo'shish</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot Nomi</label>
              <div className="relative">
                <Package size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Masalan: СЗП"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">O'lchov Birligi</label>
              <div className="relative">
                <Scale size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Masalan: litr"
                />
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Variantlar (vergul bilan)</label>
              <div className="relative">
                <ListFilter size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={variants}
                  onChange={(e) => setVariants(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.200, 0.250"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow flex items-center justify-center space-x-2"
            >
              <PlusCircle size={18} />
              <span>Qo'shish</span>
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Mavjud Mahsulotlar ({products.length})</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-500">Mahsulot Nomi</th>
                <th className="px-6 py-4 font-medium text-slate-500">O'lchov Birligi</th>
                <th className="px-6 py-4 font-medium text-slate-500">Variantlar</th>
                <th className="px-6 py-4 font-medium text-slate-500 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    Mahsulotlar ro'yxati bo'sh
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600">{p.unit}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {p.variants && p.variants.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.variants.map((v, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-xs border border-slate-200">
                              {v}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Yo'q</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setEditingProduct(p)}
                          className="text-slate-500 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition"
                          title="Tahrirlash"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => onDeleteProduct(p.id)}
                          className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
                          title="O'chirish"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 4.2 SETTINGS MANAGEMENT (NEW)
const AdminSettings = ({
  config,
  onSave
}: {
  config: TelegramConfig,
  onSave: (c: TelegramConfig) => void
}) => {
  const [botToken, setBotToken] = useState(config.botToken);
  const [chatId, setChatId] = useState(config.chatId);
  const [isSaved, setIsSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSave = () => {
    onSave({ botToken, chatId });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestMessage = async () => {
    if (!botToken || !chatId) return;
    setTestStatus('sending');
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ <b>Sinov Xabari</b>\n\nTaminotManager tizimi Telegram boti muvaffaqiyatli ulandi!",
          parse_mode: 'HTML'
        })
      });
      if (response.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (e) {
      console.error(e);
      setTestStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Sozlamalar</h2>
        <p className="text-slate-500 mb-6">Telegram bot orqali bildirishnomalarni sozlash.</p>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="space-y-6">
            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start">
               <AlertCircle className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
               <p className="text-sm text-yellow-800">
                 Diqqat: Ushbu ma'lumotlar brauzeringiz xotirasida (localStorage) saqlanadi. 
                 Haqiqiy loyihada maxfiy kalitlarni serverda saqlash tavsiya etiladi.
               </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telegram Bot Token</label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              />
              <p className="text-xs text-slate-400 mt-1">@BotFather orqali olingan token.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chat ID (User ID yoki Kanal ID)</label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="987654321 yoki -100123456789"
              />
              <p className="text-xs text-slate-400 mt-1">Xabarlar yuboriladigan foydalanuvchi yoki guruh ID si. (Bot guruhda admin bo'lishi kerak)</p>
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition shadow flex items-center"
              >
                <Save size={18} className="mr-2" />
                Saqlash
              </button>
              
              <button
                onClick={handleTestMessage}
                disabled={!botToken || !chatId || testStatus === 'sending'}
                className={`flex items-center font-medium py-2 px-4 rounded-lg transition border ${
                  testStatus === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
                  testStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                 {testStatus === 'sending' ? <Loader2 className="animate-spin mr-2" size={18} /> : 
                  testStatus === 'success' ? <Check className="mr-2" size={18} /> : 
                  testStatus === 'error' ? <AlertCircle className="mr-2" size={18} /> :
                  <Send className="mr-2" size={18} />
                 }
                 {testStatus === 'sending' ? 'Yuborilmoqda...' : 
                  testStatus === 'success' ? 'Xabar yuborildi' : 
                  testStatus === 'error' ? 'Xatolik' : 'Sinov xabari'}
              </button>
            </div>

            {isSaved && (
              <p className="text-green-600 text-sm flex items-center">
                <Check size={14} className="mr-1" /> Sozlamalar saqlandi
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. ORGANIZATION REQUEST FORM
const OrgRequestForm = ({ 
  user, 
  products,
  onSubmit 
}: { 
  user: User, 
  products: Product[],
  onSubmit: (req: Partial<Requisition>) => void 
}) => {
  const [selectedProduct, setSelectedProduct] = useState(products.length > 0 ? products[0].id : '');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(BLOOD_GROUPS[0]);
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);

  // Update selectedProduct if products change (e.g., initial load)
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
        setSelectedProduct(products[0].id);
    }
  }, [products]);

  // When product changes, set default variant if available
  useEffect(() => {
    const product = products.find(p => p.id === selectedProduct);
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant('');
    }
  }, [selectedProduct, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    onSubmit({
      productId: product.id,
      productName: product.name,
      quantity: Number(quantity),
      unit: product.unit,
      variant: selectedVariant,
      bloodGroup: selectedBloodGroup,
      comment
    });

    setSuccess(true);
    setQuantity(1);
    setComment('');
    setTimeout(() => setSuccess(false), 3000);
  };

  const currentProduct = products.find(p => p.id === selectedProduct);

  if (products.length === 0) {
      return (
          <div className="text-center p-8 bg-white rounded-xl shadow-sm text-slate-500">
              Hozircha tizimda mahsulotlar mavjud emas. Iltimos admin bilan bog'laning.
          </div>
      )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Yangi Talabnoma Yuborish</h2>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        {success && (
          <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg flex items-center">
            <Check size={20} className="mr-2" /> Talabnoma muvaffaqiyatli yuborildi!
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mahsulotni tanlang</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (o'lchov: {p.unit})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hajmi / Turi ({currentProduct?.unit})
                </label>
                {currentProduct?.variants && currentProduct.variants.length > 0 ? (
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                  >
                    {currentProduct.variants.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                   <div className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg text-slate-400 italic">
                      Variantlar yo'q
                   </div>
                )}
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                   Qon Guruhi
                </label>
                <select
                  value={selectedBloodGroup}
                  onChange={(e) => setSelectedBloodGroup(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                >
                  {BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Soni (necha dona)
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Qo'shimcha izoh (ixtiyoriy)</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Masalan: Shoshilinch zarur"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition shadow-md hover:shadow-lg flex justify-center items-center"
          >
            <PlusCircle size={20} className="mr-2" /> Yuborish
          </button>
        </form>
      </div>
    </div>
  );
};

// 6. ORGANIZATION HISTORY
const OrgHistory = ({ requests }: { requests: Requisition[] }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Mening Talabnomalarim Tarixi</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-600">Sana</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Mahsulot</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Hajmi</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Guruh</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Soni</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Holat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  Hozircha tarix mavjud emas.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(req.date).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{req.productName}</td>
                  <td className="px-6 py-4 text-slate-600">{req.variant ? `${req.variant} ${req.unit}` : '-'}</td>
                   <td className="px-6 py-4 text-slate-600">
                    <span className="font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs border border-red-100">
                      {req.bloodGroup || '-'}
                    </span>
                   </td>
                  <td className="px-6 py-4 text-slate-600">{req.quantity} ta</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      req.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-800' :
                      req.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {req.status === RequestStatus.APPROVED ? 'Tasdiqlandi' :
                       req.status === RequestStatus.REJECTED ? 'Rad etildi' : 'Kutilmoqda'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [requests, setRequests] = useState<Requisition[]>([]);
  
  // State for Users (Orgs + Admins)
  const [users, setUsers] = useState<User[]>(() => {
    const storedUsers = localStorage.getItem('users');
    return storedUsers ? JSON.parse(storedUsers) : MOCK_USERS;
  });

  // State for Products
  const [products, setProducts] = useState<Product[]>(() => {
    const storedProducts = localStorage.getItem('products');
    if (!storedProducts) return PRODUCTS;
    const parsed = JSON.parse(storedProducts);
    return parsed.length > 0 ? parsed : PRODUCTS;
  });

  // State for Stock Transactions (Warehouse)
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(() => {
    const storedTx = localStorage.getItem('stockTransactions');
    return storedTx ? JSON.parse(storedTx) : [];
  });

  // State for Telegram Config
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    const storedConfig = localStorage.getItem('telegramConfig');
    return storedConfig ? JSON.parse(storedConfig) : { botToken: '', chatId: '' };
  });

  // Initialize Data
  useEffect(() => {
    const storedRequests = localStorage.getItem('requests');
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests));
    } else {
      setRequests(INITIAL_REQUESTS);
      localStorage.setItem('requests', JSON.stringify(INITIAL_REQUESTS));
    }

    if (!localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify(MOCK_USERS));
    }

    if (!localStorage.getItem('products')) {
      localStorage.setItem('products', JSON.stringify(PRODUCTS));
    }
    
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (requests.length > 0) {
      localStorage.setItem('requests', JSON.stringify(requests));
    }
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('stockTransactions', JSON.stringify(stockTransactions));
  }, [stockTransactions]);

  useEffect(() => {
    localStorage.setItem('telegramConfig', JSON.stringify(telegramConfig));
  }, [telegramConfig]);

  const handleLogin = (u: string, p: string) => {
    const foundUser = users.find(user => user.username === u && user.password === p);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      setActiveTab(foundUser.role === UserRole.ADMIN ? 'dashboard' : 'new-request');
    } else {
      alert("Login yoki parol noto'g'ri!");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const sendTelegramNotification = async (req: Requisition) => {
    const { botToken, chatId } = telegramConfig;
    if (!botToken || !chatId) return;

    const message = `
📢 <b>Yangi Talabnoma</b>

🏢 <b>Tashkilot:</b> ${req.orgName}
📦 <b>Mahsulot:</b> ${req.productName}
⚖️ <b>Hajmi:</b> ${req.variant || '-'}
🩸 <b>Guruh:</b> ${req.bloodGroup || '-'}
🔢 <b>Soni:</b> ${req.quantity} ${req.unit}
📅 <b>Sana:</b> ${new Date(req.date).toLocaleString('uz-UZ')}
📝 <b>Izoh:</b> ${req.comment || 'Yo\'q'}
    `;

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });
    } catch (error) {
      console.error("Telegram notification error:", error);
    }
  };

  const handleCreateRequest = async (reqData: Partial<Requisition>) => {
    if (!user) return;
    const newRequest: Requisition = {
      id: Math.random().toString(36).substr(2, 9),
      orgId: user.id,
      orgName: user.name,
      productId: reqData.productId!,
      productName: reqData.productName!,
      quantity: reqData.quantity!,
      unit: reqData.unit!,
      variant: reqData.variant,
      bloodGroup: reqData.bloodGroup,
      date: new Date().toISOString(),
      status: RequestStatus.PENDING,
      comment: reqData.comment
    };
    
    setRequests(prev => [newRequest, ...prev]);
    
    // Send Telegram notification
    await sendTelegramNotification(newRequest);
  };

  const handleStatusUpdate = (id: string, status: RequestStatus) => {
    const request = requests.find(r => r.id === id);
    if (request) {
      const newTransactions: StockTransaction[] = [];
      const timestamp = new Date().toISOString();

      // If changing TO APPROVED from non-approved
      if (status === RequestStatus.APPROVED && request.status !== RequestStatus.APPROVED) {
         // 1. Deduct from ADMIN stock (OUT)
         const adminOutTx: StockTransaction = {
           id: `tx-admin-${Date.now()}`,
           orgId: 'admin',
           productId: request.productId,
           productName: request.productName,
           variant: request.variant,
           quantity: request.quantity,
           type: 'OUT',
           date: timestamp,
           comment: `Tasdiqlangan talabnoma (Admin -> ${request.orgName})`,
           relatedRequestId: request.id
         };
         newTransactions.push(adminOutTx);

         // 2. Add to ORG stock (IN)
         const orgInTx: StockTransaction = {
           id: `tx-org-${Date.now()}`,
           orgId: request.orgId,
           productId: request.productId,
           productName: request.productName,
           variant: request.variant,
           quantity: request.quantity,
           type: 'IN',
           date: timestamp,
           comment: `Qabul qilindi (Markazdan)`,
           relatedRequestId: request.id
         };
         newTransactions.push(orgInTx);
      }
      
      // If changing FROM APPROVED TO REJECTED/PENDING (Reverting approval)
      if (request.status === RequestStatus.APPROVED && status !== RequestStatus.APPROVED) {
         // 1. Refund to ADMIN stock (IN)
         const adminInTx: StockTransaction = {
           id: `tx-admin-refund-${Date.now()}`,
           orgId: 'admin',
           productId: request.productId,
           productName: request.productName,
           variant: request.variant,
           quantity: request.quantity,
           type: 'IN',
           date: timestamp,
           comment: `Bekor qilingan talabnoma (Qaytarildi): ${request.orgName}`,
           relatedRequestId: request.id
         };
         newTransactions.push(adminInTx);

         // 2. Deduct from ORG stock (OUT - correction)
         const orgOutTx: StockTransaction = {
           id: `tx-org-refund-${Date.now()}`,
           orgId: request.orgId,
           productId: request.productId,
           productName: request.productName,
           variant: request.variant,
           quantity: request.quantity,
           type: 'OUT',
           date: timestamp,
           comment: `Bekor qilindi (Admin tomonidan)`,
           relatedRequestId: request.id
         };
         newTransactions.push(orgOutTx);
      }

      if (newTransactions.length > 0) {
        setStockTransactions(prev => [...prev, ...newTransactions]);
      }
    }

    setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
  };

  const handleDeleteRequest = (id: string) => {
    if (window.confirm("Rostdan ham ushbu talabnomani o'chirmoqchimisiz?")) {
      setRequests(prev => prev.filter(req => req.id !== id));
    }
  };

  const handleEditRequest = (updatedReq: Requisition) => {
    setRequests(prev => prev.map(req => req.id === updatedReq.id ? updatedReq : req));
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Rostdan ham bu tashkilotni o'chirmoqchimisiz?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Ushbu mahsulotni o'chirsangiz, u eski hisobotlarda ham ko'rinmasligi mumkin. Davom etasizmi?")) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddStock = (productId: string, variant: string, quantity: number, comment: string) => {
    // This is for Admin adding to Central Warehouse
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newTx: StockTransaction = {
      id: `tx-${Date.now()}`,
      orgId: 'admin',
      productId,
      productName: product.name,
      variant,
      quantity,
      type: 'IN',
      date: new Date().toISOString(),
      comment
    };
    setStockTransactions(prev => [...prev, newTx]);
  };

  const handleOrgConsumption = (productId: string, variant: string, quantity: number, comment: string) => {
    if (!user) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}`,
      orgId: user.id,
      productId,
      productName: product.name,
      variant,
      quantity,
      type: 'OUT', // Consumption
      date: new Date().toISOString(),
      comment: comment || 'Ishlatildi (Chiqim)'
    };
    setStockTransactions(prev => [...prev, newTx]);
  }

  const handleUpdateTelegramConfig = (config: TelegramConfig) => {
    setTelegramConfig(config);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {user.role === UserRole.ADMIN && activeTab === 'dashboard' && (
        <AdminDashboard 
          requests={requests}
          products={products} 
          onUpdateStatus={handleStatusUpdate} 
          onDeleteRequest={handleDeleteRequest}
          onEditRequest={handleEditRequest}
        />
      )}
      {user.role === UserRole.ADMIN && activeTab === 'warehouse' && (
        <AdminWarehouse 
           users={users}
           products={products}
           stockTransactions={stockTransactions}
           onAddStock={handleAddStock}
        />
      )}
      {user.role === UserRole.ADMIN && activeTab === 'statistics' && (
        <AdminStats requests={requests} users={users} />
      )}
      {user.role === UserRole.ADMIN && activeTab === 'organizations' && (
        <AdminUsers 
          users={users} 
          requests={requests} 
          onAddUser={handleAddUser} 
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser} 
        />
      )}
      {user.role === UserRole.ADMIN && activeTab === 'products' && (
        <AdminProducts 
          products={products} 
          onAddProduct={handleAddProduct} 
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct} 
        />
      )}
      {user.role === UserRole.ADMIN && activeTab === 'settings' && (
        <AdminSettings config={telegramConfig} onSave={handleUpdateTelegramConfig} />
      )}
      
      {/* ORGANIZATION VIEWS */}
      {user.role === UserRole.ORG && activeTab === 'new-request' && (
        <OrgRequestForm user={user} products={products} onSubmit={handleCreateRequest} />
      )}
      {user.role === UserRole.ORG && activeTab === 'warehouse' && (
        <OrgWarehouse 
           user={user}
           products={products}
           stockTransactions={stockTransactions}
           onAddTransaction={handleOrgConsumption}
        />
      )}
      {user.role === UserRole.ORG && activeTab === 'statistics' && (
        <OrgStats 
          requests={requests.filter(r => r.orgId === user.id)}
        />
      )}
      {user.role === UserRole.ORG && activeTab === 'history' && (
        <OrgHistory requests={requests.filter(r => r.orgId === user.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())} />
      )}
    </Layout>
  );
}