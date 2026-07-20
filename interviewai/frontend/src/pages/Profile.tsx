import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Award, Flame, CheckCircle2, Edit2, Upload, Sparkles, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, Button, Skeleton } from '@/components/ui';
import api from '@/services/api';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [college, setCollege] = useState(user?.college || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [saving, setSaving] = useState(false);

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [targetCompany, setTargetCompany] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await api.patch('/users/me', {
        name,
        bio,
        college,
        skills: skillsArray,
      });

      await refreshUser();
      setEditing(false);
      toast.success('Profile updated successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file.');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setAnalyzing(true);
    
    const formData = new FormData();
    formData.append('resume', resumeFile);
    if (targetCompany) {
      formData.append('targetCompany', targetCompany);
    }

    try {
      const { data } = await api.post('/users/me/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await refreshUser();
      setSuggestedQuestions(data.suggestedQuestions || []);
      setResumeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Resume analyzed successfully by AI!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to analyze resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Profile Details Card */}
      <Card className="flex flex-col md:flex-row items-start gap-5">
        <div className="h-20 w-20 rounded-full bg-mint/15 border border-mint/30 flex items-center justify-center text-2xl font-display text-mint shrink-0 self-center md:self-start">
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input font-display text-xl text-ink w-full max-w-sm mb-1"
                  placeholder="Your Name"
                />
              ) : (
                <h1 className="font-display text-xl text-ink">{user.name}</h1>
              )}
              <p className="text-xs text-ink-muted">{user.email}</p>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-ink-muted hover:text-ink">
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="label">College</label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="input text-xs"
                    placeholder="Enter College Name"
                  />
                </div>
                <div>
                  <label className="label">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="input text-xs"
                    rows={2}
                    placeholder="Tell us about yourself"
                  />
                </div>
                <div>
                  <label className="label">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="input text-xs font-mono"
                    placeholder="e.g. React, TypeScript, Node.js"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveChanges} loading={saving} className="py-1.5 px-4 text-xs">
                    Save changes
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setName(user.name);
                      setBio(user.bio || '');
                      setCollege(user.college || '');
                      setSkills(user.skills?.join(', ') || '');
                      setEditing(false);
                    }}
                    className="py-1.5 px-4 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {user.college && (
                  <p className="text-xs text-ink-muted">
                    <span className="font-semibold text-ink">College:</span> {user.college}
                  </p>
                )}
                <p className="text-sm text-ink-muted">{user.bio || 'No bio yet — tell the world about yourself.'}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(user.skills?.length ? user.skills : ['No skills added']).map((s) => (
                    <span key={s} className="tag text-xxs">
                      {s}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Gamification Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CheckCircle2 className="h-5 w-5 text-mint mx-auto mb-2" />
          <p className="stat-number">{user.problemsSolved}</p>
          <p className="text-xs text-ink-muted mt-1">Problems Solved</p>
        </Card>
        <Card className="text-center">
          <Flame className="h-5 w-5 text-amber mx-auto mb-2" />
          <p className="stat-number">{user.streak?.current ?? 0}</p>
          <p className="text-xs text-ink-muted mt-1">Current Streak</p>
        </Card>
        <Card className="text-center">
          <Award className="h-5 w-5 text-signal mx-auto mb-2" />
          <p className="stat-number">{user.badges?.length ?? 0}</p>
          <p className="text-xs text-ink-muted mt-1">Badges Earned</p>
        </Card>
      </div>

      {/* Badges & Achievements */}
      <Card>
        <h2 className="font-display text-sm text-ink mb-4">Badges & Achievements</h2>
        {user.badges?.length || user.achievements?.length ? (
          <div className="space-y-4">
            {user.badges && user.badges.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">Earned Badges</h3>
                <div className="flex gap-4 flex-wrap">
                  {user.badges.map((b) => (
                    <div key={b._id} className="flex flex-col items-center gap-1.5 w-20 text-center">
                      <div className={`h-12 w-12 rounded-full border flex items-center justify-center bg-surface-raised ${
                        b.tier === 'gold' ? 'border-amber/40 text-amber' : 
                        b.tier === 'silver' ? 'border-ink-muted/40 text-ink-muted' : 
                        'border-difficulty-hard/30 text-difficulty-hard'
                      }`}>
                        <Award className="h-5 w-5" />
                      </div>
                      <p className="text-xxs font-medium text-ink leading-tight">{b.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user.achievements && user.achievements.length > 0 && (
              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">Unlocked Achievements</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {user.achievements.map((a) => (
                    <div key={a._id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised border border-border">
                      <div className="h-10 w-10 rounded-lg bg-signal/15 text-signal flex items-center justify-center shrink-0">
                        <Sparkles className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink">{a.title}</p>
                        <p className="text-xxs text-ink-muted">{a.description}</p>
                        <span className="text-[10px] text-mint mt-1 block">+{a.xpReward} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-ink-muted">Solve problems and complete interviews to start earning badges.</p>
        )}
      </Card>

      {/* Resume Analyzer Section */}
      <Card className="space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-mint" />
          <h2 className="font-display text-sm text-ink">AI Resume Analyzer</h2>
        </div>

        <p className="text-xs text-ink-muted -mt-4 leading-relaxed">
          Upload your resume in PDF format. Our AI will analyze your skills against standard technical requirements, highlight missing skills, and suggest coding prep topics and questions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-border rounded-xl cursor-pointer bg-surface-raised hover:bg-surface-overlay transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-ink-muted mb-2" />
                  <p className="text-xs text-ink-muted">
                    {resumeFile ? (
                      <span className="text-mint font-medium">{resumeFile.name}</span>
                    ) : (
                      <span>Click to upload resume (PDF only, max 5MB)</span>
                    )}
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleResumeSelect}
                />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label text-xs">Target Company (Optional)</label>
              <select
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="input text-xs"
              >
                <option value="">None (Generic Prep)</option>
                <option value="Google">Google</option>
                <option value="Amazon">Amazon</option>
                <option value="Meta">Meta</option>
                <option value="Microsoft">Microsoft</option>
                <option value="Apple">Apple</option>
                <option value="Netflix">Netflix</option>
                <option value="Adobe">Adobe</option>
                <option value="Atlassian">Atlassian</option>
                <option value="Uber">Uber</option>
              </select>
            </div>
            
            <Button
              onClick={handleResumeUpload}
              disabled={!resumeFile || analyzing}
              loading={analyzing}
              className="w-full text-xs py-2"
            >
              Analyze Resume
            </Button>
          </div>
        </div>

        {analyzing && (
          <div className="space-y-3 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {/* Display Analysis Results */}
        {!analyzing && user.resume?.analyzedAt && (
          <div className="pt-4 border-t border-border space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-ink-muted">
                Last analyzed: {new Date(user.resume.analyzedAt).toLocaleString()}
              </span>
              {user.resume.fileUrl && (
                <a
                  href={`${api.defaults.baseURL || 'http://localhost:5000'}${user.resume.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xxs text-mint flex items-center gap-1 hover:underline"
                >
                  <FileText className="h-3 w-3" /> View Uploaded PDF
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-mint flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Extracted Skills
                </h4>
                <div className="flex flex-wrap gap-1">
                  {user.resume.extractedSkills?.length ? (
                    user.resume.extractedSkills.map((s) => (
                      <span key={s} className="tag text-xxs bg-mint/5 border-mint/20 text-mint">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xxs text-ink-muted">No skills found</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-difficulty-hard flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> Missing Skills / Gaps
                </h4>
                <div className="flex flex-wrap gap-1">
                  {user.resume.missingSkills?.length ? (
                    user.resume.missingSkills.map((s) => (
                      <span key={s} className="tag text-xxs bg-difficulty-hard/5 border-difficulty-hard/20 text-difficulty-hard">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xxs text-ink-muted">No gaps identified</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-signal flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Recommended Topics
                </h4>
                <div className="flex flex-wrap gap-1">
                  {user.resume.recommendedTopics?.length ? (
                    user.resume.recommendedTopics.map((s) => (
                      <span key={s} className="tag text-xxs bg-signal/5 border-signal/20 text-signal">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xxs text-ink-muted">No topics recommended</span>
                  )}
                </div>
              </div>
            </div>

            {suggestedQuestions.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-ink">AI-Suggested Prep Questions</h4>
                <ul className="text-xs text-ink-muted list-disc pl-4 space-y-1">
                  {suggestedQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
