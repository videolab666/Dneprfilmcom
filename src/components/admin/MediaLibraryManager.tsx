import { MediaLibraryManager as MediaLibraryManagerCore } from './MediaLibraryManagerCore';
import { MediaLibraryOperations } from './MediaLibraryOperations';

export function MediaLibraryManager() {
  return (
    <div className="space-y-6">
      <MediaLibraryOperations />
      <MediaLibraryManagerCore />
    </div>
  );
}
