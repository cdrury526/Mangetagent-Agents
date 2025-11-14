import { useState } from 'react';
import { FormInput } from '../forms/FormInput';
import { Button } from '../ui/Button';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SenderIdentityFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function SenderIdentityForm({ onSuccess, onCancel }: SenderIdentityFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    title: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name || !formData.email) {
        throw new Error('Name and email are required');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate a temporary BoldSign identity ID (will be replaced by actual API call)
      const tempIdentityId = `identity_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Store in database (in production, this would be after creating in BoldSign API)
      const { error: insertError } = await supabase
        .from('bold_sign_identities')
        .insert({
          agent_id: user.id,
          bold_sign_identity_id: tempIdentityId,
          name: formData.name,
          email: formData.email,
          company_name: formData.companyName || null,
          title: formData.title || null,
          is_default: false,
          approval_status: 'approved', // For now, auto-approve
        });

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <FormInput
        label="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="John Doe"
        required
      />

      <FormInput
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="john@example.com"
        helpText="This email will be used as the sender identity for documents. BoldSign will send a verification email."
        required
      />

      <FormInput
        label="Company Name (Optional)"
        value={formData.companyName}
        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
        placeholder="Acme Real Estate"
      />

      <FormInput
        label="Title (Optional)"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Real Estate Agent"
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> After creating your sender identity, you'll receive a verification email from BoldSign.
          Click the verification link in that email to activate your identity before sending documents.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Identity'}
        </Button>
      </div>
    </form>
  );
}
