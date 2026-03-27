import React from 'react';
import { ArrowRight, Link2 } from 'lucide-react';
import GlassCard from '../../../components/ui/GlassCard';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

// Save link entry panel shown at the top of the dashboard.
// Input: link value, loading state, submit handler, and change handler.
// Output: compact product panel for quick URL capture.
const SaveLinkPanel = ({ value, onChange, onSubmit, loading, inputRef }) => {
  return (
    <GlassCard interactive className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(248,174,29,0.14)] text-accent">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#fff1d5] sm:text-lg">Quick Save Link</h2>
            <p className="mt-1 text-sm text-obsidian-500">Paste URL to archive automatically.</p>
          </div>
        </div>

        <ArrowRight className="mt-1 h-4 w-4 text-obsidian-500" />
      </div>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 lg:flex-row">
        <Input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://example.com/knowledge"
          icon={Link2}
          className="flex-1"
        />
        <Button type="submit" variant="amber" loading={loading} className="rounded-2xl px-5 py-3">
          Save Link
        </Button>
      </form>
    </GlassCard>
  );
};

export default SaveLinkPanel;
