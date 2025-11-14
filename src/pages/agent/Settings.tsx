import { useState } from 'react';
import { AgentLayout } from '../../components/AgentLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types/database';
import { Save, AlertCircle, CheckCircle2, User, Briefcase, CreditCard, ExternalLink } from 'lucide-react';
import { FormInput } from '../../components/forms/FormInput';
import { openGeneralPortal } from '../../utils/stripePortal';
import { formatPhoneNumber } from '../../utils/phoneFormatter';

export function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const { subscription, isActive } = useSubscription();
  const [formData, setFormData] = useState<Partial<Profile>>({
    name: profile?.name || '',
    phone: profile?.phone ? formatPhoneNumber(profile.phone) : '',
    broker_name: profile?.broker_name || '',
    broker_split_rate: profile?.broker_split_rate ? profile.broker_split_rate * 100 : null,
  });
  const [saving, setSaving] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleManageSubscription = async () => {
    if (!user) {
      setError('User not found');
      return;
    }

    setManagingSubscription(true);
    setError(null);

    try {
      await openGeneralPortal('/settings');
    } catch (err: any) {
      setError(err.message || 'Failed to open subscription management');
      setManagingSubscription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const cleanedPhone = formData.phone ? formData.phone.replace(/\D/g, '') : null;

      const updates: Partial<Profile> = {
        name: formData.name || null,
        phone: cleanedPhone,
        broker_name: formData.broker_name || null,
        broker_split_rate:
          formData.broker_split_rate !== null && formData.broker_split_rate !== undefined
            ? formData.broker_split_rate / 100
            : null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AgentLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">Manage your profile and preferences</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">Your settings have been saved</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <FormInput
                label="Email Address"
                type="email"
                value={profile?.email || ''}
                disabled
                helpText="Your email address cannot be changed"
              />

              <FormInput
                label="Full Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
              />

              <FormInput
                label="Phone Number"
                type="tel"
                value={formData.phone ? formatPhoneNumber(formData.phone) : ''}
                onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                placeholder="(555) 123-4567"
                maxLength={14}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 text-emerald-600 mr-2" />
                <h2 className="text-lg font-semibold text-slate-900">Brokerage Information</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <FormInput
                label="Brokerage Name"
                value={formData.broker_name || ''}
                onChange={(e) => setFormData({ ...formData, broker_name: e.target.value })}
                placeholder="Enter your brokerage name"
              />

              <div>
                <FormInput
                  label="Broker Split Rate (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.broker_split_rate ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      broker_split_rate: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="e.g., 70"
                  helpText="The percentage of commission you receive after your broker's split (e.g., enter 70 for a 70/30 split)"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-900">Subscription</h2>
            </div>
          </div>

          <div className="p-6">
            {isActive && subscription ? (
              <div className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-green-800">Active Subscription</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Your <strong>{subscription.plan === 'monthly' ? 'MagnetAgent Pro' : subscription.plan}</strong> subscription is active
                      </p>
                      <div className="mt-2">
                        <p className="text-xs text-green-600">
                          Next billing: {new Date(subscription.current_period_end!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  <ExternalLink className="w-4 h-4" />
                  {managingSubscription ? 'Opening Portal...' : 'Manage Subscription'}
                </button>
                <p className="text-xs text-slate-600 text-center">
                  Update payment method, view invoices, or cancel your subscription
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-600 mb-4">You don't have an active subscription</p>
                <a
                  href="/subscription"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 transition-all"
                >
                  View Plans
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </AgentLayout>
  );
}
