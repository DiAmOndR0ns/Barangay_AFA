import React, { useState } from 'react';
import { Product, OfficerRole } from '../types';
import { 
  ShoppingBag, Plus, Edit, Trash2, Eye, EyeOff, X, Check, Search, Tag, DollarSign, Package, User, Phone, MapPin
} from 'lucide-react';

interface ProductManagementModalProps {
  products: Product[];
  currentRole: OfficerRole;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onClose: () => void;
}


export default function ProductManagementModal({
  products,
  currentRole,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onClose
}: ProductManagementModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [cebName, setCebName] = useState('');
  const [category, setCategory] = useState<Product['category']>('Produce');
  const [price, setPrice] = useState<number>(100);
  const [unit, setUnit] = useState('matag kilo');
  const [quantityAvailable, setQuantityAvailable] = useState('100 ka kilo');
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState('');
  const [stockStatus, setStockStatus] = useState<Product['stockStatus']>('In Stock');
  const [farmerName, setFarmerName] = useState('');
  const [farmerSitio, setFarmerSitio] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const getOfficerTitle = (role: OfficerRole) => {
    switch (role) {
      case 'President': return 'President Zenaida A. Elbiña';
      case 'Vice_President': return 'Vice President Anselna B. Arnado';
      case 'Treasurer': return 'Treasurer Gracelyn P. Asendiente';
      case 'Auditor': return 'Auditor Lorena B. Pinote';
      default: return `${role} Officer`;
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setCebName('');
    setCategory('Produce');
    setPrice(100);
    setUnit('matag kilo');
    setQuantityAvailable('100 ka kilo');
    setDescription('');
    setSpecs('');
    setStockStatus('In Stock');
    setFarmerName('');
    setFarmerSitio('Sitio Fatima');
    setFarmerPhone('0912-345-6789');
    setIsPublished(true);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCebName(p.cebName || '');
    setCategory(p.category);
    setPrice(p.price);
    setUnit(p.unit);
    setQuantityAvailable(p.quantityAvailable || 'Available in harvest stock');
    setDescription(p.description);
    setSpecs(p.specs || '');
    setStockStatus(p.stockStatus);
    setFarmerName(p.farmerName || p.contactPerson || '');
    setFarmerSitio(p.farmerSitio || '');
    setFarmerPhone(p.farmerPhone || '');
    setIsPublished(p.isPublished);
    setShowAddEditModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    const contactStr = `${farmerName || 'BAFA Member Farmer'} ${farmerSitio ? `• ${farmerSitio}` : ''} (${farmerPhone || 'Contact BAFA Officer'})`;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name,
        cebName,
        category,
        price: Number(price),
        unit,
        quantityAvailable,
        description,
        specs,
        stockStatus,
        farmerName,
        farmerSitio,
        farmerPhone,
        contactPerson: contactStr,
        isPublished,
        updatedBy: getOfficerTitle(currentRole),
        dateUpdated: new Date().toISOString().split('T')[0]
      });
    } else {
      onAddProduct({
        name,
        cebName,
        category,
        price: Number(price),
        unit,
        quantityAvailable,
        description,
        specs,
        stockStatus,
        farmerName,
        farmerSitio,
        farmerPhone,
        contactPerson: contactStr,
        isPublished,
        updatedBy: getOfficerTitle(currentRole),
        managedBy: getOfficerTitle(currentRole),
        dateUpdated: new Date().toISOString().split('T')[0]
      });
    }

    setShowAddEditModal(false);
  };

  const handleTogglePublish = (p: Product) => {
    onUpdateProduct({
      ...p,
      isPublished: !p.isPublished,
      updatedBy: getOfficerTitle(currentRole),
      dateUpdated: new Date().toISOString().split('T')[0]
    });
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cebName && p.cebName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[95] animate-fade-in text-left">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>BAFA Product Management Module</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full">
                  Pres., Treas. & Auditor Access
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Manage and publish association farm produce, livestock, coffee & goods for guests and members.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLS BAR */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Pangitaa ang produkto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 shrink-0"
            >
              <option value="All">Tanan Kategoriya</option>
              <option value="Produce">Produce (Ani)</option>
              <option value="Livestock">Livestock (Baboyan/Mahi-mahi)</option>
              <option value="Processed Goods">Processed Goods</option>
              <option value="Seeds & Fertilizer">Seeds & Fertilizer</option>
              <option value="Coffee & Crops">Coffee & Crops</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Idugang ang Produkto (Add Product)</span>
          </button>
        </div>

        {/* PRODUCTS GRID / LIST */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-slate-800/80">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-300">Walay nakit-an nga produkto</p>
              <p className="text-xs text-slate-500 mt-1">I-click ang "Idugang ang Produkto" aron makadugang og bag-ong baligya sa asosasyon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    product.isPublished 
                      ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700' 
                      : 'bg-slate-950/40 border-slate-800/60 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {product.category}
                        </span>
                        <h3 className="text-sm font-black text-white mt-1">{product.name}</h3>
                        {product.cebName && (
                          <p className="text-xs font-semibold text-emerald-400 font-sans">{product.cebName}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(product)}
                          title={product.isPublished ? 'Unpublish from Public Catalog' : 'Publish to Public Catalog'}
                          className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                            product.isPublished
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          {product.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Sigurado ka nga gusto nimong idelete ang ${product.name}?`)) {
                              onDeleteProduct(product.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{product.description}</p>

                    {product.specs && (
                      <p className="text-[11px] text-slate-500 italic mt-1">Specs: {product.specs}</p>
                    )}

                    {/* Quantity Available & Farmer Details */}
                    <div className="mt-2.5 p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-xs">
                      {product.quantityAvailable && (
                        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                          <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span><strong>Kadaghanon (Quantity):</strong> {product.quantityAvailable}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                        <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span><strong>Mag-uuma (Selling Farmer):</strong> {product.farmerName || product.contactPerson || 'BAFA Member'}</span>
                      </div>
                      {(product.farmerSitio || product.farmerPhone) && (
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pl-5">
                          {product.farmerSitio && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> {product.farmerSitio}</span>
                          )}
                          {product.farmerPhone && (
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-400" /> {product.farmerPhone}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-sm font-mono font-black text-amber-400">
                        PHP {product.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">/ {product.unit}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        product.stockStatus === 'In Stock' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        product.stockStatus === 'Low Stock' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        product.stockStatus === 'Pre-Order' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {product.stockStatus}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        product.isPublished ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {product.isPublished ? 'Gimantala (Published)' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 text-center font-mono">
          Barangay Alegria Farmers Association (BAFA) • Product Registry System
        </div>
      </div>

      {/* ADD / EDIT PRODUCT SUB-MODAL */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in text-left">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>{editingProduct ? 'I-edit ang Produkto' : 'Idugang ang Bag-ong Produkto'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Pangalan sa Produkto (English Name):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Tuburan Organic Coffee Beans"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Visayan / Cebuano Title:</label>
                <input
                  type="text"
                  placeholder="e.g., Espesyal nga Kape gikan sa Tuburan"
                  value={cebName}
                  onChange={(e) => setCebName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Kategoriya (Category):</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Produce">Produce (Ani)</option>
                    <option value="Livestock">Livestock (Baboy/Manok)</option>
                    <option value="Processed Goods">Processed Goods</option>
                    <option value="Seeds & Fertilizer">Seeds & Fertilizer</option>
                    <option value="Coffee & Crops">Coffee & Crops</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Stock Status:</label>
                  <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="In Stock">In Stock (Anya ra)</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Pre-Order">Pre-Order</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Presyo (PHP):</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Unidad (Unit):</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. matag kilo, matag 250g bag"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Kadaghanon nga Baligya (Quantity Available):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 250 ka kilo, 50 ka sako, 12 ka ulo"
                  value={quantityAvailable}
                  onChange={(e) => setQuantityAvailable(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              {/* FARMER SELLER CONTACT DETAILS */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                <span className="block text-amber-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Detalyas sa Mag-uuma nga Nagbaligya (Selling Farmer Contact):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Pangalan sa Mag-uuma (Farmer Name)"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Sitio (e.g., Sitio Fatima)"
                    value={farmerSitio}
                    onChange={(e) => setFarmerSitio(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Numero sa Telepono (Phone)"
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Pahayag / Description:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Mubo nga deskripsyon sa produkto ug mga kaayohan niini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Especificaciones / Specs (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g., 100% Organic, LGU Certified"
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publish-checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="publish-checkbox" className="text-white font-bold text-xs cursor-pointer">
                  I-mantala dayon sa Guest Portal ug Member Catalog (Publish)
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Kanselahi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black cursor-pointer shadow-md"
                >
                  I-save ang Produkto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
