import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { mockProjects, type MockProject } from '../mock/projects';
import { Plus, Menu } from 'lucide-react';
import { BaseButton, BaseDocumentUpload, BaseInput, BaseModal } from '../components';
import { type LayoutOutletContext } from '../components/Layout';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  const [projects, setProjects] = useState<MockProject[]>(() => [...mockProjects]);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectDocs, setProjectDocs] = useState<File[]>([]);
  const [createProjectError, setCreateProjectError] = useState('');

  const openCreateProjectModal = () => {
    setProjectName('');
    setProjectDesc('');
    setProjectDocs([]);
    setCreateProjectError('');
    setShowCreateProjectModal(true);
  };

  const closeCreateProjectModal = () => {
    setShowCreateProjectModal(false);
    setCreateProjectError('');
  };

  const handleCreateProject = () => {
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setCreateProjectError('请输入项目名称');
      return;
    }

    const newProject: MockProject = {
      id: `p-local-${Date.now()}`,
      name: trimmedName,
      desc: projectDesc.trim() || '暂无项目描述',
      count: 0,
      knowledge: projectDocs.length,
      members: 1,
      visibility: 'private',
      privateType: 'team',
    };

    setProjects((prev) => [newProject, ...prev]);
    closeCreateProjectModal();
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="z-10 flex h-16 shrink-0 items-center justify-between bg-white/80 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors" title="展开边栏">
              <Menu size={20} />
            </button>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-primaryText">项目</span>
          </div>
        </div>
        <BaseButton
          type="primary"
          size="small"
          rounded="large"
          icon={<Plus size={14} />}
          className="shrink-0"
          onClick={openCreateProjectModal}
        >
          创建新项目
        </BaseButton>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4 md:px-8 lg:px-10 md:pb-12 md:pt-6">
        <div className="max-w-[1240px] mx-auto">
          <section className="pb-0">
            <h2 className="text-2xl font-semibold text-primaryText">科研项目</h2>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((proj) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => navigate(`/project/${proj.id}`)}
                className="group rounded-lg border border-[var(--color-line-subtle)] bg-[var(--color-surface)] px-4 py-3.5 text-left transition-all hover:border-[var(--color-gray-3)] hover:shadow-sm"
              >
                <div className="mb-1">
                  <h3 className="truncate text-lg font-medium text-primaryText">{proj.name}</h3>
                </div>

                <p className="line-clamp-2 min-h-[40px] text-sm leading-5 text-secondaryText">{proj.desc}</p>

                <div className="mt-4 flex items-center gap-2 text-sm text-tertiaryText">
                  <span>{proj.knowledge}文档</span>
                  <span>·</span>
                  <span>{proj.count}对话</span>
                </div>
              </button>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-[var(--color-border-soft)] px-4 py-10 text-center text-sm text-tertiaryText">
                暂无项目
              </div>
            )}
          </div>
        </div>
      </div>

      <BaseModal
        visible={showCreateProjectModal}
        title="创建新项目"
        width={560}
        maskClosable={false}
        okText="创建"
        cancelText="取消"
        onCancel={closeCreateProjectModal}
        onConfirm={handleCreateProject}
        bodyClassName="!px-6 !py-5"
      >
        <div className="space-y-4">
          <section className="space-y-2">
            <div className="text-sm font-medium text-primaryText">
              项目名称 <span className="text-[var(--color-danger)]">*</span>
            </div>
            <BaseInput
              value={projectName}
              placeholder="请输入项目名称"
              onChange={(event) => {
                setProjectName(event.target.value);
                if (createProjectError) {
                  setCreateProjectError('');
                }
              }}
            />
          </section>

          <section className="space-y-2">
            <div className="text-sm font-medium text-primaryText">项目描述（选填）</div>
            <textarea
              value={projectDesc}
              onChange={(event) => setProjectDesc(event.target.value)}
              placeholder="请输入项目描述"
              rows={4}
              className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-primaryText transition-colors placeholder:text-tertiaryText hover:border-[var(--color-gray-3)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </section>

          <section className="space-y-2">
            <div className="text-sm font-medium text-primaryText">项目文档（选填）</div>
            <BaseDocumentUpload
              value={projectDocs}
              maxCount={5}
              maxSize={20 * 1024 * 1024}
              onChange={setProjectDocs}
              onError={(error) => setCreateProjectError(error.message)}
            />
          </section>

          {createProjectError && <div className="text-sm text-[var(--color-danger)]">{createProjectError}</div>}
        </div>
      </BaseModal>
    </div>
  );
}