import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Check,
  Heart,
  LogOut,
  MapPin,
  PackageCheck,
  Pencil,
  Plus,
  Save,
  ShoppingBag,
  Star,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { apiRequest } from '../utils/api'

const emptyAddress = {
  label: 'Home',
  name: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false,
}

function Account({ user, onLogout, onUserUpdate }) {
  const [profile, setProfile] = useState(user)
  const [name, setName] = useState(user?.name || '')
  const [address, setAddress] = useState(emptyAddress)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const userId = user?._id
  const isAdmin = user?.isAdmin

  const refreshProfile = async () => {
    const nextProfile = await apiRequest('/users/profile')
    setProfile(nextProfile)
    setName(nextProfile.name || '')
    onUserUpdate(nextProfile)
    return nextProfile
  }

  useEffect(() => {
    if (!userId || isAdmin) return

    apiRequest('/users/profile')
      .then((nextProfile) => {
        setProfile(nextProfile)
        setName(nextProfile.name || '')
      })
      .catch((requestError) => {
        setError(requestError.message)
      })
  }, [userId, isAdmin])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.isAdmin) {
    return <Navigate to="/admin" replace />
  }

  const clearFeedback = () => {
    setMessage('')
    setError('')
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    clearFeedback()
    setIsSaving(true)

    try {
      const updatedProfile = await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name }),
      })
      setProfile(updatedProfile)
      onUserUpdate(updatedProfile)
      setMessage('Profile updated successfully.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const openAddAddress = () => {
    clearFeedback()
    setEditingAddressId(null)
    setAddress(emptyAddress)
    setShowAddressForm(true)
  }

  const openEditAddress = (savedAddress) => {
    clearFeedback()
    setEditingAddressId(savedAddress._id)
    setAddress({
      ...emptyAddress,
      ...savedAddress,
    })
    setShowAddressForm(true)
  }

  const closeAddressForm = () => {
    setEditingAddressId(null)
    setAddress(emptyAddress)
    setShowAddressForm(false)
  }

  const saveAddress = async (event) => {
    event.preventDefault()
    clearFeedback()
    setIsSaving(true)

    try {
      await apiRequest(
        editingAddressId
          ? `/users/addresses/${editingAddressId}`
          : '/users/addresses',
        {
          method: editingAddressId ? 'PUT' : 'POST',
          body: JSON.stringify(address),
        },
      )
      await refreshProfile()
      setMessage(
        editingAddressId
          ? 'Address updated successfully.'
          : 'Address added successfully.',
      )
      closeAddressForm()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteAddress = async (addressId) => {
    clearFeedback()
    setIsSaving(true)

    try {
      await apiRequest(`/users/addresses/${addressId}`, {
        method: 'DELETE',
      })
      await refreshProfile()
      if (editingAddressId === addressId) closeAddressForm()
      setMessage('Address deleted.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const makeDefaultAddress = async (addressId) => {
    clearFeedback()
    setIsSaving(true)

    try {
      await apiRequest(`/users/addresses/${addressId}/default`, {
        method: 'PUT',
      })
      await refreshProfile()
      setMessage('Default address updated.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const updateAddressField = (event) => {
    const { name: fieldName, value, checked, type } = event.target
    setAddress((current) => ({
      ...current,
      [fieldName]: type === 'checkbox' ? checked : value,
    }))
  }

  return (
    <main className="account-layout">
      <aside className="account-nav">
        <div className="account-identity">
          <UserRound size={30} />
          <span>
            <small>Hello,</small>
            <strong>{profile?.name || user.name}</strong>
          </span>
        </div>

        <nav className="account-menu" aria-label="Account navigation">
          <a className="active" href="#profile">
            <UserRound size={18} />
            Profile
          </a>
          <a href="/orders">
            <PackageCheck size={18} />
            Orders
          </a>
          <a href="/wishlist">
            <Heart size={18} />
            Wishlist
          </a>
          <a href="/cart">
            <ShoppingBag size={18} />
            Cart
          </a>
          <button type="button" onClick={onLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </aside>

      <div className="account-content">
        <header className="account-heading">
          <span>My account</span>
          <h1>Profile & addresses</h1>
          <p>Manage your personal details and delivery locations.</p>
        </header>

        {(message || error) && (
          <div
            className={`account-feedback ${error ? 'error' : 'success'}`}
            role="status"
          >
            {error ? error : message}
          </div>
        )}

        <section className="account-section" id="profile">
          <div className="account-section-title">
            <div>
              <span>Personal information</span>
              <h2>Your details</h2>
            </div>
          </div>

          <form className="account-form" onSubmit={saveProfile}>
            <label>
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label>
              Email address
              <input value={profile?.email || user.email} disabled />
            </label>
            <button className="primary-btn" type="submit" disabled={isSaving}>
              <Save size={17} />
              Save changes
            </button>
          </form>
        </section>

        <section className="account-section" id="addresses">
          <div className="account-section-title address-section-title">
            <div>
              <span>Delivery locations</span>
              <h2>Saved addresses</h2>
            </div>
            <button
              className="secondary-btn add-address-trigger"
              type="button"
              onClick={openAddAddress}
            >
              <Plus size={17} />
              Add address
            </button>
          </div>

          {profile?.addresses?.length ? (
            <div className="saved-addresses">
              {profile.addresses.map((item) => (
                <article
                  className={item.isDefault ? 'default-address' : ''}
                  key={item._id}
                >
                  <div className="saved-address-header">
                    <span className="address-label">
                      <MapPin size={15} />
                      {item.label || 'Address'}
                    </span>
                    {item.isDefault && (
                      <span className="default-address-badge">
                        <Check size={13} />
                        Default
                      </span>
                    )}
                  </div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.street}, {item.city}, {item.state} - {item.pincode}
                  </p>
                  <small>Phone: {item.phone}</small>
                  <div className="saved-address-actions">
                    <button
                      type="button"
                      onClick={() => openEditAddress(item)}
                      disabled={isSaving}
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                    {!item.isDefault && (
                      <button
                        type="button"
                        onClick={() => makeDefaultAddress(item._id)}
                        disabled={isSaving}
                      >
                        <Star size={15} />
                        Make default
                      </button>
                    )}
                    <button
                      className="danger-action"
                      type="button"
                      onClick={() => deleteAddress(item._id)}
                      disabled={isSaving}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="no-addresses">
              <MapPin size={28} />
              <strong>No saved addresses yet</strong>
              <p>Add an address to make checkout quicker.</p>
            </div>
          )}

          {showAddressForm && (
            <form
              className="account-form address-account-form"
              onSubmit={saveAddress}
            >
              <div className="address-form-heading field-wide">
                <div>
                  <span>
                    {editingAddressId ? 'Edit address' : 'New address'}
                  </span>
                  <h3>
                    {editingAddressId
                      ? 'Update delivery details'
                      : 'Add delivery details'}
                  </h3>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={closeAddressForm}
                  aria-label="Close address form"
                >
                  <X size={18} />
                </button>
              </div>

              <label>
                Address label
                <input
                  name="label"
                  value={address.label}
                  onChange={updateAddressField}
                  placeholder="Home, Work..."
                  required
                />
              </label>
              <label>
                Full name
                <input
                  name="name"
                  value={address.name}
                  onChange={updateAddressField}
                  required
                />
              </label>
              <label>
                Phone number
                <input
                  name="phone"
                  value={address.phone}
                  onChange={updateAddressField}
                  inputMode="numeric"
                  maxLength="10"
                  pattern="[6-9][0-9]{9}"
                  required
                />
              </label>
              <label>
                PIN code
                <input
                  name="pincode"
                  value={address.pincode}
                  onChange={updateAddressField}
                  inputMode="numeric"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                />
              </label>
              <label className="field-wide">
                Street address
                <input
                  name="street"
                  value={address.street}
                  onChange={updateAddressField}
                  placeholder="House number, building, area"
                  required
                />
              </label>
              <label>
                City
                <input
                  name="city"
                  value={address.city}
                  onChange={updateAddressField}
                  required
                />
              </label>
              <label>
                State
                <input
                  name="state"
                  value={address.state}
                  onChange={updateAddressField}
                  required
                />
              </label>
              <label className="address-default-check field-wide">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={address.isDefault}
                  onChange={updateAddressField}
                />
                Use as my default delivery address
              </label>

              <div className="address-form-actions field-wide">
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={isSaving}
                >
                  <Save size={17} />
                  {editingAddressId ? 'Update address' : 'Save address'}
                </button>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={closeAddressForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}

export default Account
