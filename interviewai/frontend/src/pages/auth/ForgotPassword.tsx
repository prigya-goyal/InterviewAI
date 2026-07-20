import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles, Mail } from 'lucide-react';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base bg-grid-fade bg-grid px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-8 w-8 rounded-md bg-mint flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-base" />
          </div>
          <span className="font-display font-semibold text-xl text-ink">InterviewAI</span>
        </div>

        <div className="card-raised">
          <h1 className="font-display text-xl text-ink mb-1">Reset your password</h1>
          <p className="text-sm text-ink-muted mb-6">We'll email you a reset link.</p>

          {sent ? (
            <p className="text-sm text-mint">If that email exists, a reset link is on its way. Check your inbox.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-9"
                  />
                </div>
              </div>
              <Button type="submit" loading={loading} className="w-full">
                Send reset link
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-ink-muted mt-6">
          <Link to="/login" className="text-mint hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
