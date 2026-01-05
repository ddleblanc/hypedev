import { StudioNewProvider } from '@/contexts/studio-new-context';
import { StudioShell } from '@/components/studio-new/studio-shell';
import { StudioGuard } from '@/components/studio/studio-guard';

export default function StudioNewPage() {
  return (
    <StudioGuard>
      <StudioNewProvider>
        <StudioShell />
      </StudioNewProvider>
    </StudioGuard>
  );
}
