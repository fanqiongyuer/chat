import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Play, Trash2, Menu } from 'lucide-react';

export default function ToolPage() {
  const navigate = useNavigate();
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<{
    isSidebarOpen: boolean;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  }>();
  const [result, setResult] = useState<string | null>(null);

  const handleRun = () => {
    setResult("相似度：98.5%\n匹配区域：ATCGATCG-ATCGATCG");
  };

  return (
    <div className="p-8 md:p-12 h-full overflow-y-auto bg-white w-full">
      <div className="max-w-[800px] mx-auto">
        <div className="flex items-center gap-4 mb-2">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors" title="展开边栏">
              <Menu size={20} />
            </button>
          )}
          <button onClick={() => navigate('/tools')} className={`p-2 ${isSidebarOpen ? '-ml-2' : ''} text-secondaryText hover:bg-bgLight rounded-full transition-colors`}>
            <ArrowLeft size={20}/>
          </button>
          <h1 className="text-3xl font-normal text-primaryText">序列比对助手</h1>
        </div>
        <p className="text-secondaryText text-base mb-10 ml-10">快速进行 DNA/RNA 序列比对与同源性分析</p>

        <div className="border border-borderGray rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-base font-medium text-primaryText mb-3">输入序列 1</label>
            <textarea className="input-base h-28 font-mono" placeholder="ATCGATCGATCG..." />
          </div>
          <div>
            <label className="block text-base font-medium text-primaryText mb-3">输入序列 2</label>
            <textarea className="input-base h-28 font-mono" placeholder="ATCGATCGATCG..." />
          </div>

          <div className="flex gap-4 pt-2">
            <button onClick={handleRun} className="btn-primary">
              <Play size={16} className="fill-current" /> 运行比对
            </button>
            <button className="btn-ghost">
              <Trash2 size={16} /> 重置
            </button>
          </div>

          {result && (
            <div className="mt-8 pt-8 border-t border-borderGray animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-medium mb-4 text-primaryText">运行结果</h3>
              <div className="code-block">
                <div className="code-block-header">结果</div>
                <div className="code-block-content whitespace-pre-line">
                  {result}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
