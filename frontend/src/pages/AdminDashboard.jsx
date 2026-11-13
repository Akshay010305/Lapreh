import {
  AlertTriangle,
  Boxes,
  ImageUp,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  MapPin,
  PackageCheck,
  ReceiptText,
  Save,
  ShoppingCart,
  Trash2,
  Truck,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { appConfig } from '../config/env'
import { formatPrice, getProductImages, resolveMediaSrc } from '../data/catalog'
import { apiRequest } from '../utils/api'

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--brand)',
  },
}

const nextOrderStatuses = {
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
}

const blankVariant = {
  name: '',
  sku: '',
  size: '',
  color: '',
  fabric: '',
  price: '',
  stock: 0,
}

const blankProduct = {
  name: '',
  productCode: '',
  description: '',
  price: '',
  originalPrice: '',
  discount: 0,
  image: '',
  video: '',
  category: '',
  stock: 0,
  variants: [],
}

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

function ProductManagement({ products, categories, onRefresh, onError }) {
  const [form, setForm] = useState(blankProduct)
  const [editingId, setEditingId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const lowStockChart = products
    .slice()
    .sort((a, b) => (a.stock || 0) - (b.stock || 0))
    .slice(0, 8)
    .map((product) => ({ name: product.name.slice(0, 16), stock: product.stock || 0 }))

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const editProduct = (product) => {
    setEditingId(product._id)
    setForm({
      ...blankProduct,
      ...product,
      category: product.category?._id || product.category || '',
      variants: product.variants?.length ? product.variants : [],
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(blankProduct)
  }

  const updateVariant = (index, field, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    }))
  }

  const uploadImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const image = await readFileAsDataUrl(file)
      const data = await apiRequest('/uploads/product-image', {
        method: 'POST',
        body: JSON.stringify({ image, fileName: file.name }),
      })
      updateField('image', data.imageUrl)
    } catch (requestError) {
      onError(requestError.message)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        originalPrice: Number(form.originalPrice) || undefined,
        discount: Number(form.discount) || 0,
        stock: Number(form.stock) || 0,
        category: form.category || undefined,
        variants: form.variants.map((variant) => ({
          ...variant,
          price: variant.price === '' ? undefined : Number(variant.price),
          stock: Number(variant.stock) || 0,
        })),
      }
      await apiRequest(editingId ? `/products/${editingId}` : '/products', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      resetForm()
      onRefresh()
    } catch (requestError) {
      onError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await apiRequest(`/products/${productId}`, { method: 'DELETE' })
      onRefresh()
      if (editingId === productId) resetForm()
    } catch (requestError) {
      onError(requestError.message)
    }
  }

  return (
    <div className="admin-product-manager">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit product' : 'Add product'}</CardTitle>
          <CardDescription>Manage photos, pricing, stock, and variants in one place.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="admin-product-form" onSubmit={saveProduct}>
            <label>
              Product name
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
            </label>
            <label>
              Product code
              <input value={form.productCode || ''} onChange={(event) => updateField('productCode', event.target.value)} />
            </label>
            <label className="field-wide">
              Description
              <textarea value={form.description || ''} onChange={(event) => updateField('description', event.target.value)} rows="3" />
            </label>
            <label>
              Price
              <input type="number" min="0" value={form.price} onChange={(event) => updateField('price', event.target.value)} required />
            </label>
            <label>
              MRP
              <input type="number" min="0" value={form.originalPrice || ''} onChange={(event) => updateField('originalPrice', event.target.value)} />
            </label>
            <label>
              Discount %
              <input type="number" min="0" value={form.discount || 0} onChange={(event) => updateField('discount', event.target.value)} />
            </label>
            <label>
              Stock
              <input type="number" min="0" value={form.stock || 0} onChange={(event) => updateField('stock', event.target.value)} />
            </label>
            <label>
              Category
              <select value={form.category || ''} onChange={(event) => updateField('category', event.target.value)}>
                <option value="">Choose category</option>
                {categories.map((category) => (
                  <option value={category._id} key={category._id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="field-wide">
              Product image
              <div className="admin-upload-row">
                <input value={form.image || ''} onChange={(event) => updateField('image', event.target.value)} placeholder="Image URL" />
                <Button type="button" variant="outline" asChild>
                  <span>
                    <ImageUp /> {uploading ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadImage} hidden />
                  </span>
                </Button>
              </div>
            </label>
            <label className="field-wide">
              Product video
              <input value={form.video || ''} onChange={(event) => updateField('video', event.target.value)} placeholder="Video URL" />
            </label>

            <div className="admin-variant-box field-wide">
              <div>
                <strong>Variants</strong>
                <Button type="button" variant="outline" size="sm" onClick={() => setForm((current) => ({ ...current, variants: [...current.variants, blankVariant] }))}>
                  Add variant
                </Button>
              </div>
              {form.variants.length === 0 && <p>Add size, color, fabric, or SKU options when this product has choices.</p>}
              {form.variants.map((variant, index) => (
                <div className="admin-variant-row" key={variant._id || index}>
                  <input placeholder="Name" value={variant.name} onChange={(event) => updateVariant(index, 'name', event.target.value)} />
                  <input placeholder="SKU" value={variant.sku || ''} onChange={(event) => updateVariant(index, 'sku', event.target.value)} />
                  <input placeholder="Size" value={variant.size || ''} onChange={(event) => updateVariant(index, 'size', event.target.value)} />
                  <input placeholder="Color" value={variant.color || ''} onChange={(event) => updateVariant(index, 'color', event.target.value)} />
                  <input placeholder="Fabric" value={variant.fabric || ''} onChange={(event) => updateVariant(index, 'fabric', event.target.value)} />
                  <input type="number" min="0" placeholder="Price" value={variant.price || ''} onChange={(event) => updateVariant(index, 'price', event.target.value)} />
                  <input type="number" min="0" placeholder="Stock" value={variant.stock || 0} onChange={(event) => updateVariant(index, 'stock', event.target.value)} />
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setForm((current) => ({ ...current, variants: current.variants.filter((_, itemIndex) => itemIndex !== index) }))}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>

            <div className="admin-form-actions field-wide">
              <Button type="submit" disabled={isSaving}><Save /> {isSaving ? 'Saving...' : 'Save product'}</Button>
              {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel edit</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock view</CardTitle>
          <CardDescription>Lowest stock products that need attention.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ stock: { label: 'Stock', color: 'var(--brand)' } }} className="h-[240px] w-full">
            <BarChart data={lowStockChart}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis width={28} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="stock" fill="var(--color-stock)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="admin-products-list">
            {products.map((product) => (
              <article key={product._id}>
                <img src={resolveMediaSrc(getProductImages(product)[0] || product.image, 'image')} alt={product.name || ''} />
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.variants?.length ? `${product.variants.length} variants` : 'Single option'} · {product.stock || 0} in stock</small>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => editProduct(product)}>Edit</Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => deleteProduct(product._id)}><Trash2 /></Button>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminDashboard({ user, onLogout }) {
  const [dashboard, setDashboard] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [trackingDraft, setTrackingDraft] = useState({
    courier: '',
    trackingNumber: '',
    trackingUrl: '',
    estimatedDelivery: '',
  })
  const [returnResolutionNote, setReturnResolutionNote] = useState('')
  const [isResolvingReturn, setIsResolvingReturn] = useState(false)

  const loadDashboard = () => {
    apiRequest('/admin/dashboard')
      .then(setDashboard)
      .catch((requestError) => setError(requestError.message))
  }

  const loadProducts = () => {
    Promise.all([apiRequest('/products'), apiRequest('/categories')])
      .then(([nextProducts, nextCategories]) => {
        setProducts(nextProducts)
        setCategories(nextCategories)
      })
      .catch((requestError) => setError(requestError.message))
  }

  const refreshAdminData = () => {
    loadDashboard()
    loadProducts()
  }

  useEffect(refreshAdminData, [])

  useEffect(() => {
    if (!selectedOrder) return
    setTrackingDraft({
      courier: selectedOrder.tracking?.courier || '',
      trackingNumber: selectedOrder.tracking?.trackingNumber || '',
      trackingUrl: selectedOrder.tracking?.trackingUrl || '',
      estimatedDelivery: selectedOrder.tracking?.estimatedDelivery
        ? selectedOrder.tracking.estimatedDelivery.slice(0, 10)
        : '',
    })
  }, [selectedOrder?._id])

  if (!user) return <Navigate to="/login" state={{ from: '/admin' }} replace />
  if (!user.isAdmin) return <Navigate to="/account" replace />

  const updateOrderStatus = async (orderId, status) => {
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      loadDashboard()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const saveTracking = async (orderId) => {
    try {
      const updated = await apiRequest(`/orders/${orderId}/tracking`, {
        method: 'PUT',
        body: JSON.stringify({ tracking: trackingDraft }),
      })
      setSelectedOrder(updated)
      loadDashboard()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const resolveReturnAction = async (orderId, action) => {
    setIsResolvingReturn(true)
    try {
      const updated = await apiRequest(`/orders/${orderId}/return`, {
        method: 'PUT',
        body: JSON.stringify({ action, note: returnResolutionNote }),
      })
      setSelectedOrder(updated)
      setReturnResolutionNote('')
      loadDashboard()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsResolvingReturn(false)
    }
  }

  const metrics = [
    ['Sales', formatPrice(dashboard?.revenue || 0), IndianRupee, 'Completed and COD orders'],
    ['Orders', dashboard?.orders ?? '-', ShoppingCart, `${formatPrice(dashboard?.averageOrder || 0)} average order`],
    ['Customers', dashboard?.users ?? '-', Users, 'Customer accounts'],
    ['Products', dashboard?.products ?? '-', Boxes, `${dashboard?.lowStock?.length || 0} items running low`],
  ]

  const formatOrderDate = (value) => new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

  const getOrderItemImage = (item) => {
    const product = item.product && typeof item.product === 'object' ? item.product : {}
    const candidateImages = [
      ...getProductImages(product),
      product.image,
      product.originalImage,
      item.originalImage,
      item.image,
    ].filter(Boolean)

    return resolveMediaSrc(candidateImages[0] || '', 'image') || undefined
  }

  return (
    <main className="admin-dashboard-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <img className="admin-logo" src="/logo/lapreh-logo.png" alt={`${appConfig.name} logo`} />
            <span><strong>{appConfig.name} Admin</strong><small>Store manager</small></span>
          </div>
          <nav>
            <a href="#overview"><LayoutDashboard size={17} /> Overview</a>
            <a href="#orders"><PackageCheck size={17} /> Orders</a>
            <a href="#inventory"><Boxes size={17} /> Stock</a>
            <Link to="/catalog"><ShoppingCart size={17} /> View catalog</Link>
          </nav>
          <Button variant="outline" className="mt-auto justify-start" onClick={onLogout}>
            <LogOut /> Sign out
          </Button>
        </aside>

        <section className="admin-main">
          <header className="admin-dashboard-header" id="overview">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Store management</p>
              <h1 className="text-3xl font-semibold tracking-tight">Store overview</h1>
              <p className="mt-1 text-sm text-muted-foreground">Welcome back, {user.name}. Here is today&apos;s store update.</p>
            </div>
            <Button asChild variant="outline"><Link to="/">Open storefront</Link></Button>
          </header>

          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map(([label, value, Icon, detail]) => (
              <Card key={label}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardDescription>{label}</CardDescription>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-2xl">{value}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Sales trend</CardTitle>
                <CardDescription>Sales from recent months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[290px] w-full">
                  <AreaChart data={dashboard?.monthlySales || []} margin={{ left: 8, right: 8 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatPrice(value)} />} />
                    <Area dataKey="revenue" type="monotone" fill="url(#revenueGradient)" stroke="var(--color-revenue)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order status</CardTitle>
                <CardDescription>Where current orders stand</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {(dashboard?.statusBreakdown || []).map((item) => {
                  const percentage = dashboard?.orders ? Math.round((item.count / dashboard.orders) * 100) : 0
                  return (
                    <div className="grid gap-1.5" key={item.status}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{item.status}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })}
                {!dashboard?.statusBreakdown?.length && <p className="text-sm text-muted-foreground">No orders yet.</p>}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders" className="gap-4">
            <TabsList>
              <TabsTrigger value="orders">Recent orders</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="inventory">Low stock</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" id="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Recent customer orders</CardTitle>
                  <CardDescription>Review payments and update order status.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Return</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(dashboard?.recentOrders || []).map((order) => (
                        <TableRow key={order._id}>
                          <TableCell>
                            <button
                              type="button"
                              className="admin-order-id"
                              onClick={() => setSelectedOrder(order)}
                            >
                              #{order._id.slice(-8).toUpperCase()}
                            </button>
                            <small className="block text-muted-foreground">{formatOrderDate(order.createdAt)}</small>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              className="admin-product-summary"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <span className="admin-product-thumbs">
                                {order.items.slice(0, 3).map((item) => {
                                  const itemImage = getOrderItemImage(item)
                                  return itemImage ? (
                                    <img
                                      src={itemImage}
                                      alt={item.name || 'Product image'}
                                      key={`${order._id}-${item.product}`}
                                    />
                                  ) : null
                                })}
                              </span>
                              <span>
                                <strong>{order.items[0]?.name || 'Order items'}</strong>
                                <small>
                                  {order.items.length === 1
                                    ? `${order.items[0].quantity} item`
                                    : `${order.items.length} products`}
                                </small>
                              </span>
                            </button>
                          </TableCell>
                          <TableCell>
                            <span className="block">{order.user?.name || 'Customer'}</span>
                            <small className="text-muted-foreground">{order.user?.email}</small>
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.isPaid ? 'default' : 'secondary'}>
                              {order.paymentMethod === 'cod' ? 'COD' : order.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.returnStatus && order.returnStatus !== 'not_requested' ? (
                              <Badge variant="secondary" className="capitalize">
                                {order.returnStatus.replace('_', ' ')}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">None</span>
                            )}
                          </TableCell>
                          <TableCell>{formatPrice(order.total)}</TableCell>
                          <TableCell className="text-right">
                            {!nextOrderStatuses[order.status] ? (
                              <Badge variant="outline" className="capitalize">{order.status === 'pending' ? 'Pending payment' : order.status}</Badge>
                            ) : (
                              <Select value={order.status} onValueChange={(status) => updateOrderStatus(order._id, status)}>
                                <SelectTrigger className="ml-auto w-36 capitalize">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={order.status} disabled className="capitalize">{order.status}</SelectItem>
                                  {nextOrderStatuses[order.status].map((status) => (
                                    <SelectItem value={status} key={status} className="capitalize">{status}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" id="products">
              <ProductManagement
                products={products}
                categories={categories}
                onRefresh={refreshAdminData}
                onError={setError}
              />
            </TabsContent>

            <TabsContent value="inventory" id="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Low-stock products</CardTitle>
                  <CardDescription>Products with 10 or fewer pieces left.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {(dashboard?.lowStock || []).map((product) => (
                    <div className="flex items-center gap-3 rounded-lg border p-3" key={product._id}>
                      <img className="size-12 rounded-md object-fill" src={resolveMediaSrc(getProductImages(product)[0] || product.image, 'image')} alt={product.name || ''} />
                      <div className="min-w-0 flex-1">
                        <strong className="block truncate">{product.name}</strong>
                        <span className="text-xs text-muted-foreground">{product.category?.name || 'Uncategorized'}</span>
                      </div>
                      <Badge variant={product.stock < 5 ? 'destructive' : 'secondary'}>
                        <AlertTriangle /> {product.stock} left
                      </Badge>
                    </div>
                  ))}
                  {!dashboard?.lowStock?.length && <p className="text-sm text-muted-foreground">Stock levels look healthy.</p>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="admin-order-dialog sm:max-w-3xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder._id.slice(-8).toUpperCase()}</DialogTitle>
                <DialogDescription>
                  Placed {formatOrderDate(selectedOrder.createdAt)} by {selectedOrder.user?.name || 'Customer'}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[72vh] pr-4">
                <div className="grid gap-5">
                  <div className="admin-order-detail-summary">
                    <div><span>Status</span><Badge className="capitalize">{selectedOrder.status}</Badge></div>
                    <div><span>Payment</span><strong className="capitalize">{selectedOrder.paymentMethod === 'cod' ? 'Cash on delivery' : selectedOrder.paymentStatus.replace('_', ' ')}</strong></div>
                    <div><span>Order total</span><strong>{formatPrice(selectedOrder.total)}</strong></div>
                    {selectedOrder.returnStatus && selectedOrder.returnStatus !== 'not_requested' && (
                      <div><span>Return</span><Badge variant="secondary" className="capitalize">{selectedOrder.returnStatus.replace('_', ' ')}</Badge></div>
                    )}
                  </div>

                  <Separator />

                  <section className="admin-order-detail-section">
                    <h3><ShoppingCart /> Ordered products</h3>
                    <div className="admin-order-detail-products">
                      {selectedOrder.items.map((item) => (
                        <article key={`${selectedOrder._id}-${item.product}`}>
                          <img src={getOrderItemImage(item)} alt={item.name || 'Product image'} />
                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.quantity} x {formatPrice(item.price)}</span>
                          </div>
                          <b>{formatPrice(item.price * item.quantity)}</b>
                        </article>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  <div className="admin-order-detail-grid">
                    <section className="admin-order-detail-section">
                      <h3><Users /> Customer</h3>
                      <p><strong>{selectedOrder.user?.name || selectedOrder.address.name}</strong></p>
                      <p>{selectedOrder.user?.email}</p>
                      <p>{selectedOrder.address.phone}</p>
                    </section>
                  <section className="admin-order-detail-section">
                    <h3><MapPin /> Delivery address</h3>
                    <p>{selectedOrder.address.name}</p>
                    <p>{selectedOrder.address.street}</p>
                    <p>{selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.pincode}</p>
                  </section>
                </div>

                  <Separator />

                  <section className="admin-order-detail-section">
                    <h3><Truck /> Shipping and tracking</h3>
                    <div className="admin-tracking-form">
                      <label>
                        Courier
                        <input value={trackingDraft.courier} onChange={(event) => setTrackingDraft((current) => ({ ...current, courier: event.target.value }))} />
                      </label>
                      <label>
                        Tracking number
                        <input value={trackingDraft.trackingNumber} onChange={(event) => setTrackingDraft((current) => ({ ...current, trackingNumber: event.target.value }))} />
                      </label>
                      <label>
                        Tracking link
                        <input value={trackingDraft.trackingUrl} onChange={(event) => setTrackingDraft((current) => ({ ...current, trackingUrl: event.target.value }))} />
                      </label>
                      <label>
                        Estimated delivery
                        <input type="date" value={trackingDraft.estimatedDelivery} onChange={(event) => setTrackingDraft((current) => ({ ...current, estimatedDelivery: event.target.value }))} />
                      </label>
                      <Button type="button" onClick={() => saveTracking(selectedOrder._id)}>Save tracking</Button>
                    </div>
                  </section>

                  <Separator />

                  <section className="admin-order-detail-section">
                    <h3><ReceiptText /> Payment and totals</h3>
                    <dl className="admin-order-totals">
                      <div><dt>Subtotal</dt><dd>{formatPrice(selectedOrder.subtotal)}</dd></div>
                      <div><dt>Shipping</dt><dd>{selectedOrder.shipping ? formatPrice(selectedOrder.shipping) : 'Free'}</dd></div>
                      <div><dt>Total</dt><dd>{formatPrice(selectedOrder.total)}</dd></div>
                      {selectedOrder.paymentReference && <div><dt>Payment ID</dt><dd>{selectedOrder.paymentReference}</dd></div>}
                      {selectedOrder.refundId && <div><dt>Refund ID</dt><dd>{selectedOrder.refundId}</dd></div>}
                      {selectedOrder.refundStatus && selectedOrder.refundStatus !== 'not_required' && (
                        <div><dt>Refund status</dt><dd>{selectedOrder.refundStatus.replace('_', ' ')}</dd></div>
                      )}
                    </dl>
                  </section>

                  <Separator />

                  {selectedOrder.returnStatus !== 'not_requested' && (
                    <section className="admin-order-detail-section admin-return-resolution">
                      <h3>Return request</h3>
                      <div className="admin-return-summary-grid">
                        <div><strong>Status</strong><p className="capitalize">{selectedOrder.returnStatus.replace('_', ' ')}</p></div>
                        <div><strong>Reason</strong><p>{selectedOrder.returnReason}</p></div>
                        <div><strong>Requested</strong><p>{formatOrderDate(selectedOrder.returnRequestedAt)}</p></div>
                        {selectedOrder.returnResolvedAt && (
                          <div><strong>Resolved</strong><p>{formatOrderDate(selectedOrder.returnResolvedAt)}</p></div>
                        )}
                        {selectedOrder.returnResolutionNote && (
                          <div className="admin-return-notes"><strong>Resolution note</strong><p>{selectedOrder.returnResolutionNote}</p></div>
                        )}
                        {selectedOrder.refundId && (
                          <div><strong>Refund ID</strong><p>{selectedOrder.refundId}</p></div>
                        )}
                        {selectedOrder.refundStatus && selectedOrder.refundStatus !== 'not_required' && (
                          <div><strong>Refund status</strong><p>{selectedOrder.refundStatus.replace('_', ' ')}</p></div>
                        )}
                      </div>

                      {selectedOrder.returnStatus === 'requested' && (
                        <>
                          <label>
                            Resolution note
                            <textarea
                              value={returnResolutionNote}
                              onChange={(event) => setReturnResolutionNote(event.target.value)}
                              placeholder="Add a note for the customer"
                            />
                          </label>
                          <div className="admin-return-actions">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isResolvingReturn}
                              onClick={() => resolveReturnAction(selectedOrder._id, 'approved')}
                            >
                              Approve return
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              disabled={isResolvingReturn}
                              onClick={() => resolveReturnAction(selectedOrder._id, 'rejected')}
                            >
                              Reject return
                            </Button>
                          </div>
                        </>
                      )}
                    </section>
                  )}

                  <Separator />

                  <section className="admin-order-detail-section">
                    <h3><PackageCheck /> Tracking history</h3>
                    <div className="admin-status-history">
                      {(selectedOrder.statusHistory || []).map((event) => (
                        <div key={event._id || `${event.status}-${event.timestamp}`}>
                          <span />
                          <p>
                            <strong className="capitalize">{event.status}</strong>
                            <small>{event.note || `Order marked ${event.status}`}</small>
                          </p>
                          <time>{formatOrderDate(event.timestamp)}</time>
                        </div>
                      ))}
                    </div>
                  </section>

                  {selectedOrder.status === 'cancelled' && (
                    <>
                      <Separator />
                      <section className="admin-order-detail-section admin-cancellation-detail">
                        <h3>Cancellation details</h3>
                        <p><strong>Reason:</strong> {selectedOrder.cancellationReason}</p>
                        <p><strong>Cancelled by:</strong> {selectedOrder.cancelledBy}</p>
                        {selectedOrder.refundStatus !== 'not_required' && (
                          <p><strong>Refund:</strong> {selectedOrder.refundStatus}</p>
                        )}
                      </section>
                    </>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default AdminDashboard
