import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Car,
  Building,
  ShieldAlert,
  Users,
  Edit3,
  Save,
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getResidentByUserId,
  findFlatById,
  updateResidentProfile,
} from '../../services/residentService';
import { useCollection } from '../../hooks/useCollection';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Input, FormRow } from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import { initials } from '../../utils/format';

// Helper to safely parse emergency contact whether stored as JSON string, object, or plain string
function parseEmergencyContact(contact) {
  if (!contact) return { name: '', phone: '', relation: '' };
  
  if (typeof contact === 'object') {
    return {
      name: contact.name || '',
      phone: contact.phone || '',
      relation: contact.relation || '',
    };
  }

  if (typeof contact === 'string') {
    try {
      const parsed = JSON.parse(contact);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          name: parsed.name || '',
          phone: parsed.phone || '',
          relation: parsed.relation || '',
        };
      }
    } catch {
      return { name: contact, phone: '', relation: '' };
    }
  }

  return { name: '', phone: '', relation: '' };
}

export default function Profile() {
  const { user } = useAuth();
  
  const userId = user?.id || user?._id || user?.userId;
  const residents = useCollection('residents');
  const flats = useCollection('flats');

  const fallbackResident = user && user.role === 'resident'
    ? { ...user, id: user.id || user._id, userId: user.id || user._id, flatId: user.flatId }
    : null;

  const resident =
    residents.find(
      (r) => r.userId === userId || r.id === userId || r._id === userId
    ) || fallbackResident || null;

  const flat =
    flats.find((f) => f.id === resident?.flatId || f._id === resident?.flatId) ||
    (resident?.flatId ? findFlatById(resident.flatId) : null);

  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleNumber: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });

  // Safe parsed emergency contact details for view mode
  const emergencyInfo = parseEmergencyContact(resident?.emergencyContact);

  // Helper to sync form state from resident data
  const resetFormFromResident = (resData) => {
    if (!resData) return;
    const emergency = parseEmergencyContact(resData.emergencyContact);
    setFormData({
      name: resData.name || '',
      phone: resData.phone || '',
      email: resData.email || '',
      vehicleNumber: resData.vehicleNumber || '',
      emergencyName: emergency.name,
      emergencyPhone: emergency.phone,
      emergencyRelation: emergency.relation,
    });
  };

  // Sync form state when resident data updates, but ONLY when not in edit mode
  useEffect(() => {
    if (resident && !isEditing) {
      resetFormFromResident(resident);
    }
  }, [resident, isEditing]);

  // Auto-dismiss alert messages
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  function handleInputChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleStartEditing() {
    resetFormFromResident(resident);
    setIsEditing(true);
  }

  function handleCancel() {
    resetFormFromResident(resident);
    setIsEditing(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    // Safely resolve valid identifier (prioritize user ID, fallback to resident ID)
    const targetId = userId || resident?.userId || resident?.id || resident?._id;

    if (!targetId) {
      setErrorMessage('Valid User ID is required to update profile.');
      return;
    }

    const patch = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      vehicleNumber: formData.vehicleNumber.trim(),
      // Stringify object so backend schema expecting String accepts it without casting error
      emergencyContact: JSON.stringify({
        name: formData.emergencyName.trim(),
        phone: formData.emergencyPhone.trim(),
        relation: formData.emergencyRelation.trim(),
      }),
    };

    try {
      await updateResidentProfile(targetId, patch);
      setIsEditing(false);
      setSuccessMessage('Profile details updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    }
  }

  if (!resident) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mb-3 text-slate-400" size={40} />
        <p className="text-sm font-semibold text-slate-700">Resident record not found.</p>
        <p className="mt-1 text-xs text-slate-400">Please contact society administration for assistance.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Page Header Header Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title="My Profile"
            description="View and update your personal information, contact details, and emergency contacts."
          />
          <div className="shrink-0">
            {!isEditing ? (
              <Button 
                variant="primary" 
                type="button" 
                onClick={handleStartEditing}
                className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-sm px-4 py-2 font-semibold text-xs transition-all"
              >
                <Edit3 size={15} className="mr-1.5" /> Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  type="button" 
                  onClick={handleCancel}
                  className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  <X size={15} className="mr-1.5" /> Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit" 
                  form="profile-form"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-sm px-4 py-2 font-semibold text-xs transition-all"
                >
                  <Save size={15} className="mr-1.5" /> Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Alert Messages */}
        {successMessage && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-xs font-semibold text-emerald-800 shadow-sm animate-in fade-in duration-300">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-5 py-4 text-xs font-semibold text-rose-800 shadow-sm animate-in fade-in duration-300">
            <AlertCircle size={18} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Top Hero Banner Profile Card */}
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 font-extrabold text-white text-2xl shadow-lg shadow-cyan-600/20">
              {initials(resident.name)}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{resident.name}</h1>
                <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold border ${
                  resident.tenant 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {flat?.occupancyType || (resident.tenant ? 'Tenant' : 'Owner')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1.5">
                <Building size={14} className="text-cyan-600" />
                Registered Resident • Flat {flat?.number || '—'} (Block {flat?.block || '—'})
              </p>
            </div>
          </div>
        </div>

        <form id="profile-form" onSubmit={handleSave} className="space-y-8">
          
          {/* Personal & Vehicle Details */}
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-5 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <User size={18} className="text-cyan-600" />
                <h2 className="text-base font-bold text-slate-900">Personal & Vehicle Details</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Editable contact information used for society notifications and entry logs</p>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormRow label="Full Name">
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Full Name"
                    required
                    className="rounded-xl border-slate-200 text-xs focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </FormRow>

                <FormRow label="Phone Number">
                  <Input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+92 300 0000000"
                    required
                    className="rounded-xl border-slate-200 text-xs focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </FormRow>

                <FormRow label="Email Address">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@example.com"
                    className="rounded-xl border-slate-200 text-xs focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </FormRow>

                <FormRow label="Vehicle Number">
                  <Input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                    placeholder="e.g. KHI-1234"
                    className="rounded-xl border-slate-200 text-xs focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </FormRow>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{resident.name || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{resident.phone || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{resident.email || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                    <Car size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vehicle Number</p>
                    <p className="text-sm font-bold font-mono text-cyan-700 mt-0.5">
                      {resident.vehicleNumber || 'No vehicle registered'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Flat Details (Read-only) */}
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Building size={18} className="text-cyan-600" />
                  <h2 className="text-base font-bold text-slate-900">Flat Details</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Property allocation details</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500 border border-slate-200">
                <Lock size={12} /> Read-only
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <Hash size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Flat Number</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{flat?.number || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <Building size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Block</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">Block {flat?.block || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Occupancy Type</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{flat?.occupancyType || 'Resident'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-5 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-600" />
                <h2 className="text-base font-bold text-slate-900">Emergency Contact</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Primary contact in case of urgent security or maintenance notifications</p>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <FormRow label="Contact Name">
                  <Input
                    type="text"
                    value={formData.emergencyName}
                    onChange={(e) => handleInputChange('emergencyName', e.target.value)}
                    placeholder="Contact Name"
                    className="rounded-xl border-slate-200 text-xs focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </FormRow>

                <FormRow label="Contact Phone">
                  <Input
                    type="text"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    placeholder="+92 300 0000000"
                    className="rounded-xl border-slate-200 text-xs focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </FormRow>

                <FormRow label="Relationship">
                  <Input
                    type="text"
                    value={formData.emergencyRelation}
                    onChange={(e) => handleInputChange('emergencyRelation', e.target.value)}
                    placeholder="e.g. Spouse, Brother"
                    className="rounded-xl border-slate-200 text-xs focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </FormRow>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="flex items-center gap-4 rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Emergency Contact</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{emergencyInfo.name || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Phone</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{emergencyInfo.phone || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Relationship</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{emergencyInfo.relation || '—'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Family Members */}
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-5 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-cyan-600" />
                <h2 className="text-base font-bold text-slate-900">Family Members</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Registered family members living in this flat (Display only)</p>
            </div>

            {resident.familyMembers && resident.familyMembers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {resident.familyMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 transition-all hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 text-xs font-semibold">
                        <Users size={16} />
                      </div>
                      <span className="text-xs font-bold text-slate-900">{member.name}</span>
                    </div>
                    <span className="inline-block rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold text-cyan-700 border border-cyan-100">
                      {member.relation}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-500 text-center py-4">
                No additional family members registered for this flat.
              </p>
            )}
          </div>

          {/* Bottom Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="secondary" 
                onClick={handleCancel} 
                type="button"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold px-4 py-2"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-sm px-5 py-2 font-semibold text-xs transition-all"
              >
                <Save size={15} className="mr-1.5" /> Save Changes
              </Button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}