import React, { useState, useCallback } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  variant?: 'sage' | 'lavender';
}

const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  placeholder = 'Add tag...',
  label = 'Tags',
  variant = 'sage',
}) => {
  const [input, setInput] = useState('');

  const addTag = useCallback(() => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  }, [input, tags, onChange]);

  const removeTag = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag));
    },
    [tags, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const pillClass = variant === 'lavender' ? 'tag-pill-editor lavender' : 'tag-pill-editor';

  return (
    <div className="tags-section">
      <div className="tags-section-label">{label}</div>
      <div className="tags-display">
        {tags.map((tag) => (
          <span key={tag} className={pillClass}>
            {tag}
            <span className="tag-remove" onClick={() => removeTag(tag)}>
              ✕
            </span>
          </span>
        ))}
        <input
          type="text"
          className="tag-add-input"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
        />
      </div>
    </div>
  );
};

export default TagInput;
