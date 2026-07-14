import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components, Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, ArrowRight, Paperclip, Puzzle, AtSign } from 'lucide-react';
import 'highlight.js/styles/atom-one-light.css';
import 'katex/dist/katex.min.css';
import AssistantActions from './AssistantActions';

type AssistantFeedback = 'like' | 'dislike';
type MarkdownRemarkPlugin = NonNullable<Options['remarkPlugins']>[number];
type MarkdownRehypePlugin = NonNullable<Options['rehypePlugins']>[number];
type MermaidApi = (typeof import('mermaid'))['default'];

interface MessageAttachment {
  id: string;
  name: string;
  mimeType: string;
  previewUrl?: string;
}

interface MessageReference {
  id: string;
  type: 'skill' | 'doc';
  label: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: MessageAttachment[];
  references?: MessageReference[];
}

interface MessageItemProps {
  msg: Message;
  actionKey?: string;
  feedback?: AssistantFeedback;
  onFeedback?: (actionKey: string, type: AssistantFeedback) => void;
  onRefresh?: () => void;
  isTyping?: boolean;
  isStreaming?: boolean;
}

let mermaidInitialized = false;
let mermaidLoadPromise: Promise<MermaidApi> | null = null;
let mathPluginLoadPromise: Promise<{
  remark: MarkdownRemarkPlugin;
  rehype: MarkdownRehypePlugin;
}> | null = null;
let emojiPluginLoadPromise: Promise<MarkdownRemarkPlugin | null> | null = null;

const loadMathPlugins = async () => {
  if (!mathPluginLoadPromise) {
    mathPluginLoadPromise = Promise.all([import('remark-math'), import('rehype-katex')])
      .then(([remarkMathModule, rehypeKatexModule]) => {
        // mhchem 仅用于 \ce{} 语法，失败时不阻塞常规数学公式渲染
        void import('katex/contrib/mhchem').catch(() => undefined);

        return {
          remark: remarkMathModule.default as MarkdownRemarkPlugin,
          rehype: rehypeKatexModule.default as MarkdownRehypePlugin,
        };
      })
      .catch((error) => {
        mathPluginLoadPromise = null;
        throw error;
      });
  }

  return mathPluginLoadPromise;
};

const loadEmojiPlugin = async (): Promise<MarkdownRemarkPlugin | null> => {
  if (!emojiPluginLoadPromise) {
    emojiPluginLoadPromise = import('remark-emoji')
      .then((emojiModule) => emojiModule.default as MarkdownRemarkPlugin)
      .catch(() => {
        emojiPluginLoadPromise = null;
        return null;
      });
  }

  return emojiPluginLoadPromise;
};

const loadMermaidApi = async (): Promise<MermaidApi> => {
  if (!mermaidLoadPromise) {
    mermaidLoadPromise = import('mermaid')
      .catch(async (error) => {
        // Dev 环境下遇到 optimize 依赖失效时，回退到 node_modules 直连路径。
        const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
        if (!isDev) throw error;

        const fallbackUrl = `${window.location.origin}/node_modules/mermaid/dist/mermaid.esm.mjs`;
        return import(/* @vite-ignore */ fallbackUrl);
      })
      .then((module) => {
        const resolved = (module as { default?: MermaidApi }).default;
        return resolved ?? (module as unknown as MermaidApi);
      })
      .catch((error) => {
        mermaidLoadPromise = null;
        throw error;
      });
  }

  const mermaidApi = await mermaidLoadPromise;

  if (!mermaidInitialized) {
    mermaidApi.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      suppressErrorRendering: true,
      themeVariables: {
        primaryColor: '#14B886',
        primaryBorderColor: '#14B886',
      },
    });

    mermaidInitialized = true;
  }

  return mermaidApi;
};

const extractTextContent = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((item) => extractTextContent(item)).join('');
  }

  if (React.isValidElement(node)) {
    return extractTextContent((node.props as { children?: React.ReactNode }).children);
  }

  return '';
};

const isPdfLink = (href: string): boolean => {
  const normalized = href.trim().toLowerCase();
  return /\.pdf($|[?#])/i.test(normalized);
};

const PdfPreviewCard: React.FC<{ href: string; label: string }> = ({ href, label }) => {
  const displayName = useMemo(() => {
    const normalizedLabel = label.trim();
    if (normalizedLabel) return normalizedLabel;

    try {
      const url = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      const fileName = url.pathname.split('/').filter(Boolean).pop();
      if (fileName) return decodeURIComponent(fileName);
    } catch {
      // ignore parse error and fallback to href
    }

    return href;
  }, [href, label]);

  return (
    <div className="group not-prose my-2 inline-flex w-[340px] max-w-full items-center gap-3 rounded-xl border border-borderGray bg-surface px-3 py-2 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-warning text-xs font-semibold tracking-wide text-white">
        PDF
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-base font-medium text-primaryText">{displayName}</p>
        <p className="m-0 text-xs text-secondaryText">PDF 文档</p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label="新窗口打开 PDF"
        className="shrink-0 rounded-md p-1 text-secondaryText opacity-0 transition-opacity group-hover:opacity-100 hover:bg-bgLight focus:opacity-100"
      >
        <ArrowRight size={14} />
      </a>
    </div>
  );
};

const CodeBlock: React.FC<{
  language: string;
  rawCode: string;
  className?: string;
  children: React.ReactNode;
}> = ({ language, rawCode, className, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!rawCode.trim()) return;

    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // 忽略复制失败
    }
  }, [rawCode]);

  return (
    <div className="code-block-wrapper not-prose">
      <div className="code-block-header">
        <span className="code-block-lang-tag">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={`code-block-copy-btn ${copied ? 'copied' : ''}`}
          title={copied ? '已复制代码' : '复制代码'}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="!m-0 !rounded-none !border-0 !bg-transparent px-4 py-3 whitespace-pre-wrap break-words">
        <code className={`code-block-content ${className ?? ''}`.trim()}>{children}</code>
      </pre>
    </div>
  );
};

const MermaidBlock: React.FC<{ rawCode: string }> = ({ rawCode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!rawCode.trim()) return;

    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // 忽略复制失败
    }
  }, [rawCode]);

  return (
    <div className="code-block-wrapper not-prose">
      <div className="code-block-header">
        <span className="code-block-lang-tag">mermaid</span>
        <button
          type="button"
          onClick={handleCopy}
          className={`code-block-copy-btn ${copied ? 'copied' : ''}`}
          title={copied ? '已复制图表代码' : '复制图表代码'}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <div className="diagram-block-body overflow-x-auto px-4 py-3">
        <div className="mermaid">{rawCode}</div>
      </div>
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({
  msg,
  actionKey,
  feedback,
  onFeedback,
  onRefresh,
  isTyping = false,
  isStreaming,
}) => {
  const isUser = msg.role === 'user';
  const streaming = isStreaming ?? isTyping;
  const markdownContainerRef = useRef<HTMLDivElement | null>(null);
  const [mathRemarkPlugin, setMathRemarkPlugin] = useState<MarkdownRemarkPlugin | null>(null);
  const [mathRehypePlugin, setMathRehypePlugin] = useState<MarkdownRehypePlugin | null>(null);
  const [emojiRemarkPlugin, setEmojiRemarkPlugin] = useState<MarkdownRemarkPlugin | null>(null);
  const [emojiPluginLoaded, setEmojiPluginLoaded] = useState(false);

  const hasMermaidBlock = useMemo(() => /```\s*mermaid/i.test(msg.content), [msg.content]);
  const hasMathSyntax = useMemo(() => {
    return /\$\$[\s\S]*?\$\$|(^|[^\\])\$[^\n$]+\$|\\\(|\\\[|\\begin\{|\\ce\{/.test(msg.content);
  }, [msg.content]);
  const hasEmojiShortcode = useMemo(() => /:[a-zA-Z0-9_+-]+:/.test(msg.content), [msg.content]);

  useEffect(() => {
    if (!hasMathSyntax || mathRemarkPlugin || mathRehypePlugin) return;

    let cancelled = false;

    void loadMathPlugins()
      .then((plugins) => {
        if (cancelled) return;
        setMathRemarkPlugin(() => plugins.remark);
        setMathRehypePlugin(() => plugins.rehype);
      })
      .catch(() => {
        // 数学插件加载失败时降级为普通文本，避免打断主渲染
      });

    return () => {
      cancelled = true;
    };
  }, [hasMathSyntax, mathRemarkPlugin, mathRehypePlugin]);

  useEffect(() => {
    if (!hasEmojiShortcode || emojiPluginLoaded) return;

    let cancelled = false;

    void loadEmojiPlugin().then((plugin) => {
      if (cancelled) return;
      if (plugin) setEmojiRemarkPlugin(() => plugin);
      setEmojiPluginLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [hasEmojiShortcode, emojiPluginLoaded]);

  const remarkPlugins = useMemo<NonNullable<Options['remarkPlugins']>>(() => {
    const plugins: MarkdownRemarkPlugin[] = [remarkGfm];
    if (emojiRemarkPlugin) plugins.push(emojiRemarkPlugin);
    if (mathRemarkPlugin) plugins.push(mathRemarkPlugin);
    return plugins;
  }, [emojiRemarkPlugin, mathRemarkPlugin]);

  const rehypePlugins = useMemo<NonNullable<Options['rehypePlugins']>>(() => {
    const plugins: MarkdownRehypePlugin[] = [rehypeHighlight];
    if (mathRehypePlugin) plugins.push(mathRehypePlugin);
    return plugins;
  }, [mathRehypePlugin]);

  const markdownComponents = useMemo<Components>(
    () => ({
      table: ({ node: _node, ...props }) => (
        <div className="my-2 overflow-x-auto rounded-xl border border-borderGray bg-surface">
          <table className="!my-0 min-w-full border-collapse text-sm leading-6" {...props} />
        </div>
      ),
      tr: ({ node: _node, ...props }) => <tr className="border-b border-borderGray last:border-b-0" {...props} />,
      th: ({ node: _node, ...props }) => (
        <th
          className="border-r border-borderGray bg-bgLight px-4 py-2.5 text-left text-xs font-medium text-tertiaryText last:border-r-0"
          {...props}
        />
      ),
      td: ({ node: _node, ...props }) => (
        <td className="border-r border-borderGray px-4 py-2.5 text-sm text-primaryText last:border-r-0" {...props} />
      ),
      blockquote: ({ node: _node, ...props }) => (
        <blockquote
          className="my-3 rounded-r-md border-l-2 border-borderGray bg-transparent py-0.5 pl-4 text-base leading-7 text-tertiaryText font-normal [&>*]:my-0 [&>*]:!font-normal"
          {...props}
        />
      ),
      input: ({ node: _node, type, checked, ...props }) => {
        if (type === 'checkbox') {
          return (
            <input
              type="checkbox"
              checked={Boolean(checked)}
              disabled
              className="mr-2 accent-primary"
              {...props}
            />
          );
        }

        return <input type={type} {...props} />;
      },
      section: ({ node: _node, ...props }) => (
        <section className="mt-8 border-t border-gray-300 pt-4 text-sm text-gray-600" {...props} />
      ),
      p: ({ node: _node, children, ...props }) => {
        const childArray = React.Children.toArray(children);

        if (childArray.length === 1 && React.isValidElement(childArray[0])) {
          const onlyChild = childArray[0] as React.ReactElement<{ href?: string; children?: React.ReactNode }>;
          if (typeof onlyChild.props.href === 'string' && isPdfLink(onlyChild.props.href)) {
            const label = extractTextContent(onlyChild.props.children).trim();
            return <PdfPreviewCard href={onlyChild.props.href} label={label} />;
          }
        }

        return <p {...props}>{children}</p>;
      },
      a: ({ node: _node, href, ...props }) => {
        const link = href ?? '';
        const isDoi = /^https?:\/\/(dx\.)?doi\.org\//i.test(link) || /^doi:/i.test(link);
        const isPmid = /pubmed\.ncbi\.nlm\.nih\.gov/i.test(link) || /\/pmc\/|\/pmid\//i.test(link);
        const isPdf = isPdfLink(link);

        if (isDoi || isPmid || isPdf) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] font-medium text-primary no-underline hover:underline"
              {...props}
            />
          );
        }

        return <a href={href} target="_blank" rel="noreferrer" {...props} />;
      },
      pre({ children, ...props }) {
        const codeChild = React.Children.toArray(children).find(
          (child): child is React.ReactElement<{ className?: string; children?: React.ReactNode }> =>
            React.isValidElement(child) &&
            typeof (child.props as { className?: string }).className === 'string' &&
            (child.props as { className?: string }).className!.includes('language-'),
        );

        if (!codeChild) {
          return <pre {...props}>{children}</pre>;
        }

        const className = codeChild.props.className ?? '';
        const languageMatch = className.match(/language-([\w-]+)/);
        const language = languageMatch ? languageMatch[1].toLowerCase() : 'code';
        const rawCode = extractTextContent(codeChild.props.children).replace(/\n$/, '');

        if (language === 'mermaid') {
          return <MermaidBlock rawCode={rawCode} />;
        }

        return (
          <CodeBlock language={language} rawCode={rawCode} className={className}>
            {codeChild.props.children}
          </CodeBlock>
        );
      },
      code({ children, className, ...props }) {
        const isInline = !className;
        if (!isInline) {
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }

        return (
          <code
            className="inline-flex items-center rounded-md bg-bgLight px-2.5 py-1 text-sm leading-[1.6] !font-normal tracking-[0.01em] text-primaryText"
            {...props}
          >
            {children}
          </code>
        );
      },
    }),
    [],
  );

  useEffect(() => {
    if (isUser || streaming || !hasMermaidBlock) return;

    const root = markdownContainerRef.current;
    if (!root) return;

    const mermaidNodes = Array.from(root.querySelectorAll<HTMLElement>('.mermaid')).filter(
      (node) => node.dataset.processed !== 'true',
    );

    if (mermaidNodes.length === 0) return;

    void loadMermaidApi()
      .then(async (mermaidApi) => {
        await Promise.all(
          mermaidNodes.map(async (node, index) => {
            const source = node.textContent?.trim();
            if (!source) return;

            const id = `mermaid-${Date.now()}-${index}`;
            const { svg } = await mermaidApi.render(id, source);
            node.innerHTML = svg;
            node.dataset.processed = 'true';
          }),
        );
      })
      .catch(() => {
        // Mermaid 图表语法错误或加载失败时静默，避免打断主消息渲染
      });
  }, [isUser, streaming, hasMermaidBlock, msg.content]);

  return (
    <div className="flex w-full justify-center px-2">
      <div className={`flex w-full max-w-[860px] px-1 md:px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {isUser ? (
          <div className="message-bubble-user">
            {((msg.references && msg.references.length > 0) || (msg.attachments && msg.attachments.length > 0)) && (
              <div className="mb-2 flex flex-wrap gap-2">
                {msg.references?.map((reference) => (
                  <div
                    key={reference.id}
                    className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-sm shadow-sm ${
                      reference.type === 'skill'
                        ? 'border border-[#cfe0ff] bg-[#edf4ff] text-[#2f7bff]'
                        : 'border border-[#c5f0d8] bg-[#effff6] text-[#16935a]'
                    }`}
                  >
                    {reference.type === 'skill' ? (
                      <Puzzle size={12} className="shrink-0 text-[#2f7bff]" />
                    ) : (
                      <AtSign size={12} className="shrink-0 text-[#16935a]" />
                    )}
                    <span className="max-w-[190px] truncate" title={reference.label}>{reference.label}</span>
                  </div>
                ))}

                {msg.attachments?.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#dfe4ea] bg-white px-3 py-1.5 text-sm text-primaryText shadow-sm"
                  >
                    {attachment.previewUrl ? (
                      <span className="inline-flex h-[14px] w-[14px] shrink-0 overflow-hidden rounded-[3px] bg-[#eef3f8]">
                        <img src={attachment.previewUrl} alt={attachment.name} className="h-full w-full object-cover" />
                      </span>
                    ) : (
                      <Paperclip size={13} className="shrink-0 text-tertiaryText" />
                    )}
                    <span className="max-w-[190px] truncate" title={attachment.name}>{attachment.name}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ) : (
          <div className="flex w-full min-w-0 max-w-[85%] flex-col items-start gap-2">
          <div
            ref={markdownContainerRef}
            className="prose prose-slate max-w-none break-words text-primaryText prose-p:my-3 prose-p:text-[14px] prose-p:leading-[1.8] prose-li:text-[14px] prose-li:leading-[1.75] prose-headings:text-primaryText prose-headings:tracking-[-0.01em] prose-h1:mt-6 prose-h1:mb-3 prose-h1:text-[20px] md:prose-h1:text-[22px] prose-h1:leading-[1.3] prose-h1:font-semibold prose-h2:mt-7 prose-h2:mb-3 prose-h2:text-[16px] prose-h2:leading-[1.35] prose-h2:font-semibold prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-[16px] prose-h3:leading-[1.45] prose-h3:font-semibold prose-strong:text-primaryText prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-hr:my-6 prose-li:my-1 prose-li:marker:text-secondaryText prose-ol:pl-6 prose-ul:pl-6 prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          >
            <ReactMarkdown
              remarkPlugins={remarkPlugins}
              rehypePlugins={rehypePlugins}
              components={markdownComponents}
            >
              {msg.content}
            </ReactMarkdown>
          </div>

          {msg.content && !streaming && actionKey && onFeedback && onRefresh && (
            <AssistantActions
              markdownContent={msg.content}
              onRefresh={onRefresh}
              feedback={feedback}
              onFeedback={(type) => onFeedback(actionKey, type)}
              disabled={streaming}
            />
          )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MessageItem);