import { useState } from 'react'
import { Plus, Trash2, Pencil, Tags, Sparkles } from 'lucide-react'
import { useCategories } from '../../hooks/useCategories'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

const PRESET_COLORS = [
  '#f43f5e', '#f97316', '#eab308', '#10b981',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#64748b', '#94a3b8', '#a78bfa', '#34d399',
]

const ICONS = [
  { value: 'utensils', label: 'Comida / Restaurante' },
  { value: 'shopping-cart', label: 'Compras / Mercado' },
  { value: 'car', label: 'Transporte' },
  { value: 'home', label: 'Hogar / Vivienda' },
  { value: 'heart', label: 'Salud / Bienestar' },
  { value: 'book', label: 'Educación' },
  { value: 'star', label: 'Entretenimiento' },
  { value: 'tag', label: 'Ropa / Moda' },
  { value: 'zap', label: 'Servicios / Utilidades' },
  { value: 'coffee', label: 'Café / Snacks' },
  { value: 'music', label: 'Música' },
  { value: 'plane', label: 'Viajes' },
  { value: 'gift', label: 'Regalos' },
  { value: 'tool', label: 'Reparaciones' },
  { value: 'more-horizontal', label: 'Otros gastos' },
  { value: 'briefcase', label: 'Trabajo / Salario' },
  { value: 'laptop', label: 'Freelance / Remoto' },
  { value: 'trending-up', label: 'Negocio' },
  { value: 'bar-chart', label: 'Inversión' },
  { value: 'dollar-sign', label: 'Ingresos extra' },
  { value: 'award', label: 'Bonificación' },
  { value: 'plus-circle', label: 'Otros ingresos' },
]

function CategoryForm({ defaultValues, onSubmit, onCancel }) {
  const isEditing = !!defaultValues
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [type, setType] = useState(defaultValues?.type ?? 'expense')
  const [color, setColor] = useState(defaultValues?.color ?? '#8b5cf6')
  const [icon, setIcon] = useState(defaultValues?.icon ?? 'tag')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es requerido'); return }
    setError('')
    setLoading(true)
    try {
      await onSubmit({ name: name.trim(), type, color, icon })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div>
        <label className="label">Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          {[['expense', '↑ Gasto'], ['income', '↓ Ingreso']].map(([t, lbl]) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                type === t
                  ? t === 'expense'
                    ? 'gradient-danger text-white border-transparent'
                    : 'gradient-success text-white border-transparent'
                  : 'border-white/10 text-txt-secondary hover:border-white/20'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="label">Nombre</label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          placeholder="Ej: Gimnasio"
          className="input"
          autoFocus
        />
        {error && <p className="text-danger text-xs mt-1">{error}</p>}
      </div>

      {/* Color palette */}
      <div>
        <label className="label">Color</label>
        <div className="flex flex-wrap gap-2.5 mt-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-all ${
                color === c
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-surface scale-110'
                  : 'hover:scale-105 opacity-75 hover:opacity-100'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Icon */}
      <div>
        <label className="label">Ícono</label>
        <select
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="input"
        >
          {ICONS.map((i) => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Agregar'}
        </button>
      </div>
    </form>
  )
}

function CategorySection({ title, items, accentClass, emptyLabel, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/5">
        <div className={`w-2.5 h-2.5 rounded-full ${accentClass}`} />
        <h2 className="font-semibold text-txt-primary">{title}</h2>
        <span className="ml-auto text-xs font-medium text-txt-muted bg-bg-elevated px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-txt-muted text-sm text-center py-6">{emptyLabel}</p>
      ) : (
        <div className="space-y-0.5">
          {items.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg-elevated transition-colors group"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-txt-primary text-sm flex-1">{cat.name}</span>
              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(cat)}
                  className="p-1.5 rounded-lg text-txt-muted hover:text-primary-light hover:bg-primary/10 transition-colors"
                  title="Editar"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(cat)}
                  className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Categories() {
  const { categories, loading, add, update, remove, seedDefaults } = useCategories()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [seeding, setSeeding] = useState(false)

  const expenses = categories.filter((c) => c.type === 'expense')
  const incomes = categories.filter((c) => c.type === 'income')

  const openAdd = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (cat) => { setEditing(cat); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const handleSubmit = async (values) => {
    if (editing) {
      await update(editing.id, values)
    } else {
      await add(values)
    }
    closeModal()
  }

  const handleDelete = async (cat) => {
    if (!confirm(`¿Eliminar "${cat.name}"?\n\nLas transacciones con esta categoría quedarán sin categoría.`)) return
    try {
      await remove(cat.id)
    } catch (err) {
      alert(`No se pudo eliminar: ${err.message}`)
    }
  }

  const handleSeedDefaults = async () => {
    if (categories.length > 0 && !confirm('Se agregarán las categorías predeterminadas a las existentes. ¿Continuar?')) return
    setSeeding(true)
    try {
      await seedDefaults()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSeeding(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Categorías</h1>
          <p className="text-txt-muted text-sm mt-0.5">
            {categories.length} categorías · {expenses.length} gastos · {incomes.length} ingresos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Restaurar categorías predeterminadas"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">{seeding ? 'Cargando...' : 'Predeterminadas'}</span>
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva categoría</span>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {categories.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center opacity-60">
            <Tags size={28} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-txt-primary font-semibold">Sin categorías</p>
            <p className="text-txt-muted text-sm mt-1">
              Cargando las predeterminadas automáticamente...
            </p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <CategorySection
            title="Gastos"
            items={expenses}
            accentClass="bg-danger"
            emptyLabel="Sin categorías de gasto"
            onEdit={openEdit}
            onDelete={handleDelete}
          />
          <CategorySection
            title="Ingresos"
            items={incomes}
            accentClass="bg-success"
            emptyLabel="Sin categorías de ingreso"
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? `Editar: ${editing.name}` : 'Nueva categoría'}
      >
        <CategoryForm
          defaultValues={editing}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  )
}
