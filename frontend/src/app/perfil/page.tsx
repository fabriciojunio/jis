"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  getUserProfile,
  saveUserProfile,
  mergeImport,
  type UserProfile,
  type Prioridade,
} from "@/lib/userProfile";
import { importFromGithub } from "@/lib/github";

const PRIORIDADES: { value: Prioridade; label: string; hint: string }[] = [
  { value: "bauru", label: "Bauru primeiro", hint: "Prioriza vagas em Bauru e região" },
  { value: "brasil", label: "Brasil remoto", hint: "Prioriza vagas remotas no Brasil" },
  { value: "internacional", label: "Internacional", hint: "Prioriza vagas internacionais (remoto)" },
  { value: "equilibrado", label: "Equilibrado", hint: "Sem preferência forte de região" },
];

const NIVEIS = ["Estágio", "Trainee", "Júnior", "Pleno", "Sênior"];

export default function PerfilPage() {
  const [p, setP] = useState<UserProfile | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [ghToken, setGhToken] = useState("");
  const [ghStatus, setGhStatus] = useState<string | null>(null);
  const [ghLoading, setGhLoading] = useState(false);

  useEffect(() => {
    setP(getUserProfile());
  }, []);

  function update(patch: Partial<UserProfile>) {
    setP((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveUserProfile(next);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 1500);
      return next;
    });
  }

  async function importarGithub() {
    if (!p) return;
    setGhLoading(true);
    setGhStatus(null);
    try {
      const r = await importFromGithub(p.links.github, ghToken);
      const merged = mergeImport(p, { skills: r.skills, projetos: r.projetos });
      setP(merged);
      saveUserProfile(merged);
      setGhStatus(`Importados ${r.total} repositórios: ${r.projetos.length} projetos e ${r.skills.length} linguagens.`);
    } catch (e) {
      setGhStatus(e instanceof Error ? e.message : "Falha ao importar do GitHub.");
    } finally {
      setGhLoading(false);
    }
  }

  if (!p) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Meu perfil</h1>
          <p className="text-sm text-slate-400 mt-1">
            Seus dados alimentam o currículo e a priorização das vagas. Tudo é salvo automaticamente.
          </p>
        </div>
        <span className={`text-xs ${salvo ? "text-emerald-400" : "text-slate-600"}`}>
          {salvo ? "Salvo" : `Atualizado ${new Date(p.atualizadoEm).toLocaleString("pt-BR")}`}
        </span>
      </div>

      {/* Dados básicos */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-slate-100">Dados</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome" value={p.nome} onChange={(v) => update({ nome: v })} />
          <Field label="Título profissional" value={p.titulo} onChange={(v) => update({ titulo: v })} />
          <Field label="Cidade" value={p.cidade} onChange={(v) => update({ cidade: v })} />
          <Field label="Estado" value={p.estado} onChange={(v) => update({ estado: v })} />
        </div>
        <div>
          <label className="label">Resumo</label>
          <textarea
            className="input min-h-[80px]"
            value={p.resumo}
            onChange={(e) => update({ resumo: e.target.value })}
          />
        </div>
      </section>

      {/* Conexões */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-slate-100">Conexões</h2>

        <div className="space-y-2">
          <label className="label">GitHub</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="input flex-1"
              placeholder="usuário do GitHub"
              value={p.links.github}
              onChange={(e) => update({ links: { ...p.links, github: e.target.value } })}
            />
            <input
              className="input flex-1"
              placeholder="token opcional (mais limite / repos privados)"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
            />
            <button onClick={importarGithub} disabled={ghLoading} className="btn-primary whitespace-nowrap">
              {ghLoading ? "Importando..." : "Importar do GitHub"}
            </button>
          </div>
          {ghStatus && <p className="text-xs text-slate-400">{ghStatus}</p>}
        </div>

        <div className="space-y-2">
          <label className="label">LinkedIn</label>
          <input
            className="input"
            placeholder="https://linkedin.com/in/seu-perfil"
            value={p.links.linkedin}
            onChange={(e) => update({ links: { ...p.links, linkedin: e.target.value } })}
          />
          <p className="text-xs text-slate-500">
            O LinkedIn não libera importação automática de experiências e formação para apps de terceiros.
            Adicione esses itens manualmente nas seções abaixo.
          </p>
        </div>

        <Field
          label="Portfólio"
          value={p.links.portfolio}
          onChange={(v) => update({ links: { ...p.links, portfolio: v } })}
        />
      </section>

      {/* Preferências */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-slate-100">Preferências de busca</h2>
        <div>
          <label className="label">Prioridade de região</label>
          <div className="grid sm:grid-cols-2 gap-2">
            {PRIORIDADES.map((op) => (
              <button
                key={op.value}
                onClick={() => update({ prioridade: op.value })}
                className={`text-left rounded-lg border p-3 transition-colors ${
                  p.prioridade === op.value
                    ? "border-indigo-500/70 bg-indigo-500/10"
                    : "border-[#283041] hover:border-indigo-500/40"
                }`}
              >
                <p className="text-sm font-medium text-slate-200">{op.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{op.hint}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Senioridade alvo</label>
          <div className="flex flex-wrap gap-2">
            {NIVEIS.map((n) => {
              const on = p.senioridade.includes(n);
              return (
                <button
                  key={n}
                  onClick={() =>
                    update({
                      senioridade: on ? p.senioridade.filter((x) => x !== n) : [...p.senioridade, n],
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    on ? "bg-indigo-600 border-indigo-600 text-white" : "border-[#283041] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-100">Habilidades</h2>
        <TagInput
          values={p.skills}
          onChange={(skills) => update({ skills })}
          placeholder="Adicione uma skill e pressione Enter"
        />
      </section>

      {/* Projetos */}
      <ListSection
        title="Projetos"
        items={p.projetos}
        onChange={(projetos) => update({ projetos })}
        empty={{ nome: "", descricao: "", stack: [], url: "" }}
        render={(item, set) => (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome" value={item.nome} onChange={(v) => set({ nome: v })} />
              <Field label="Link" value={item.url ?? ""} onChange={(v) => set({ url: v })} />
            </div>
            <TextArea label="Descrição" value={item.descricao} onChange={(v) => set({ descricao: v })} />
            <TagInput
              values={item.stack}
              onChange={(stack) => set({ stack })}
              placeholder="Tecnologias do projeto (Enter)"
            />
          </>
        )}
      />

      {/* Experiências */}
      <ListSection
        title="Experiências"
        items={p.experiencias}
        onChange={(experiencias) => update({ experiencias })}
        empty={{ cargo: "", empresa: "", periodo: "", descricao: "" }}
        render={(item, set) => (
          <>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Cargo" value={item.cargo} onChange={(v) => set({ cargo: v })} />
              <Field label="Empresa" value={item.empresa} onChange={(v) => set({ empresa: v })} />
              <Field label="Período" value={item.periodo} onChange={(v) => set({ periodo: v })} />
            </div>
            <TextArea label="Descrição" value={item.descricao ?? ""} onChange={(v) => set({ descricao: v })} />
          </>
        )}
      />

      {/* Formação */}
      <ListSection
        title="Formação"
        items={p.formacao}
        onChange={(formacao) => update({ formacao })}
        empty={{ curso: "", instituicao: "", periodo: "" }}
        render={(item, set) => (
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Curso" value={item.curso} onChange={(v) => set({ curso: v })} />
            <Field label="Instituição" value={item.instituicao} onChange={(v) => set({ instituicao: v })} />
            <Field label="Período" value={item.periodo ?? ""} onChange={(v) => set({ periodo: v })} />
          </div>
        )}
      />

      {/* Cursos */}
      <ListSection
        title="Cursos e certificações"
        items={p.cursos}
        onChange={(cursos) => update({ cursos })}
        empty={{ nome: "", instituicao: "" }}
        render={(item, set) => (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Curso" value={item.nome} onChange={(v) => set({ nome: v })} />
            <Field label="Instituição" value={item.instituicao ?? ""} onChange={(v) => set({ instituicao: v })} />
          </div>
        )}
      />
    </div>
  );
}

/* ---------- componentes auxiliares ---------- */

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input min-h-[64px]" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span key={v} className="chip flex items-center gap-1.5">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="text-slate-500 hover:text-red-400">
              x
            </button>
          </span>
        ))}
      </div>
      <input
        className="input"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
      />
    </div>
  );
}

function ListSection<T extends object>({
  title,
  items,
  onChange,
  empty,
  render,
}: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  empty: T;
  render: (item: T, set: (patch: Partial<T>) => void) => ReactNode;
}) {
  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-100">{title}</h2>
        <button onClick={() => onChange([...items, { ...empty }])} className="btn-ghost py-1.5 px-3 text-xs">
          Adicionar
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-600">Nenhum item ainda.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-[#1e2638] p-4 space-y-3 relative">
              {render(item, (patch) => {
                const next = [...items];
                next[i] = { ...items[i], ...patch };
                onChange(next);
              })}
              <button
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="absolute top-3 right-3 text-xs text-slate-500 hover:text-red-400"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
