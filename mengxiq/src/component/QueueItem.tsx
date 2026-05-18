import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { priorityLevelMap, priorityLevelMapKeys } from '../model/Priority';
import { getHostname } from '../utils';
import { isEncryptedFormat, hasSessionPassphrase, decryptText, encryptText } from '../utils/encryption';
import EncryptedDescriptionView from './EncryptedDescriptionView';

function QueueItem(
  props: {
    description: string,
    link: string,
    priorityId: string,
    isEditing: boolean,
    onEdit: () => void,
    onCancelEdit: () => void,
    onSaveEdit: (description: string, link: string, priorityId: string) => void,
    deleteFuncion: () => void,
    reportFuncion: () => void,
  }
): JSX.Element {
  const [editDescription, setEditDescription] = useState(props.description);
  const [editLink, setEditLink] = useState(props.link);
  const [editPriorityId, setEditPriorityId] = useState(props.priorityId);
  const [encryptOnSave, setEncryptOnSave] = useState(isEncryptedFormat(props.description));
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const editDescriptionRef = useRef<HTMLTextAreaElement>(null);

  // Get priority styling
  const getPriorityStyle = (priorityId: string) => {
    const styles: { [key: string]: string } = {
      'do_it_now': 'border-red-500 priority-do-it-now',
      'important_doable': 'border-orange-500 priority-important-doable',
      'low_hanging_fruit': 'border-yellow-500 priority-low-hanging-fruit',
      'moon_shooting': 'border-blue-500 priority-moon-shooting',
      'select_priority': 'border-gray-300 priority-select',
    };
    return styles[priorityId] || 'border-gray-300';
  };

  const priorityDisplay = priorityLevelMap.get(props.priorityId)?.display || 'Unknown';
  const borderColor = getPriorityStyle(props.priorityId);

  const autoResizeTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    if (props.isEditing) {
      autoResizeTextarea(editDescriptionRef.current);
    }
  }, [editDescription, props.isEditing]);

  useEffect(() => {
    if (props.isEditing) {
      const isEnc = isEncryptedFormat(props.description);
      setEncryptOnSave(isEnc);
      setDecryptError(null);
      if (isEnc) {
        if (hasSessionPassphrase()) {
          setIsDecrypting(true);
          decryptText(props.description)
            .then(plaintext => {
              setEditDescription(plaintext);
              setIsDecrypting(false);
            })
            .catch(() => {
              setDecryptError('Wrong passphrase — cannot decrypt this item.');
              setIsDecrypting(false);
            });
        } else {
          setDecryptError('Set a passphrase first (🔒 Passphrase button in header)');
        }
      } else {
        setEditDescription(props.description);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isEditing]);

  const handleSave = async () => {
    if (!editDescription.trim()) {
      alert('Description cannot be empty');
      return;
    }
    let descToSave = editDescription;
    if (encryptOnSave) {
      if (!hasSessionPassphrase()) {
        alert('Set a passphrase first to encrypt this item (🔒 Passphrase button in header)');
        return;
      }
      try {
        descToSave = await encryptText(editDescription);
      } catch (e) {
        alert('Failed to encrypt. Please try again.');
        return;
      }
    }
    props.onSaveEdit(descToSave, editLink, editPriorityId);
  };

  const handleCancel = () => {
    setEditDescription(props.description);
    setEditLink(props.link);
    setEditPriorityId(props.priorityId);
    setDecryptError(null);
    setIsDecrypting(false);
    props.onCancelEdit();
  };

  // Edit mode
  if (props.isEditing) {
    const editBorderColor = getPriorityStyle(editPriorityId);
    return (
      <div className={`bg-white shadow-md rounded-lg p-4 mb-3 border-l-4 ${editBorderColor.split(' ')[0]}`}>
        <div className="space-y-3">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            {isDecrypting ? (
              <div className="text-sm text-gray-400 italic py-2">🔒 Decrypting...</div>
            ) : decryptError ? (
              <div className="text-sm text-red-600 py-2">🔒 {decryptError}</div>
            ) : (
              <textarea
                ref={editDescriptionRef}
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden"
                rows={4}
              />
            )}
          </div>

          {/* Encrypt on save toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700">
              <input
                type="checkbox"
                checked={encryptOnSave}
                onChange={e => setEncryptOnSave(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              🔒 Encrypt on save
            </label>
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
            <input
              type="text"
              value={editLink}
              onChange={e => setEditLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="grid grid-cols-2 gap-2">
              {priorityLevelMapKeys.filter(id => id !== 'select_priority').map((id) => {
                const isSelected = editPriorityId === id;
                const buttonStyles: { [key: string]: string } = {
                  'do_it_now': isSelected ? 'bg-red-500 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100',
                  'important_doable': isSelected ? 'bg-orange-500 text-white border-orange-600' : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100',
                  'low_hanging_fruit': isSelected ? 'bg-yellow-500 text-white border-yellow-600' : 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100',
                  'moon_shooting': isSelected ? 'bg-blue-500 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100',
                };
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEditPriorityId(id)}
                    className={`px-3 py-2 rounded-md border-2 font-medium transition-all duration-150 text-sm ${buttonStyles[id] || 'bg-gray-100 text-gray-700'}`}
                  >
                    {priorityLevelMap.get(id)!.display}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isDecrypting || (!!decryptError)}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors duration-150 text-sm font-medium"
            >
              💾 Save
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-150 text-sm font-medium"
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className={`bg-white shadow-md rounded-lg p-4 mb-3 border-l-4 ${borderColor.split(' ')[0]} hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-gray-800 mb-2 prose prose-base max-w-full overflow-x-auto">
            {isEncryptedFormat(props.description) ? (
              <EncryptedDescriptionView encryptedText={props.description} />
            ) : (
              <ReactMarkdown
                components={{
                  a: ({ node: _node, ...props }) => (
                    <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" />
                  ),
                  code: ({ node: _node, ...props }) => (
                    <code {...props} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono break-all max-w-full inline-block" />
                  ),
                  pre: ({ node: _node, ...props }) => (
                    <pre {...props} className="bg-gray-100 p-3 rounded overflow-x-auto my-2 whitespace-pre max-w-full" />
                  )
                }}
              >
                {props.description}
              </ReactMarkdown>
            )}
          </div>
          {props.link && (
            <a
              href={props.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1 hover:underline"
            >
              🔗 Ref Link: {getHostname(props.link)}
            </a>
          )}
        </div>
        <span className={`priority-badge ${borderColor.split(' ')[1]} shrink-0`}>
          {priorityDisplay}
        </span>
      </div>

      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          onClick={props.reportFuncion}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors duration-150 text-sm font-medium flex items-center gap-1"
        >
          ✓ Done
        </button>
        <button
          onClick={props.onEdit}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-150 text-sm font-medium"
        >
          ✏️ Edit
        </button>
        <button
          onClick={props.deleteFuncion}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors duration-150 text-sm font-medium flex items-center gap-1"
        >
          ✕ Delete
        </button>
      </div>
    </div>
  );
}

export default QueueItem;
