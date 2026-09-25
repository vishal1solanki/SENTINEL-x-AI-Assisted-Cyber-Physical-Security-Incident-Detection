import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(id || '');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getIncidents().then((list) => {
      setIncidents(list);
      if (!selectedIncidentId && list.length > 0) {
        setSelectedIncidentId(list[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedIncidentId) {
      setLoading(true);
      api.getIncidentReport(selectedIncidentId, 'html')
        .then((html) => {
          setHtmlContent(html);
        })
        .catch((err) => {
          console.error('Failed to load report HTML:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedIncidentId]);

  const handlePrint = () => {
    const iframe = document.getElementById('report-frame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/incidents"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <FileText className="w-6 h-6 text-cyan-400" />
              <span>INCIDENT AUDIT REPORT</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Print-ready forensic timeline, sensor trust audit & AI investigation dossier.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.id} - {inc.title}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs shadow-md shadow-cyan-950 transition"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT REPORT</span>
          </button>
        </div>
      </div>

      {/* Rendered Print-Ready Report Preview */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">
            Compiling forensic report...
          </div>
        ) : (
          <iframe
            id="report-frame"
            srcDoc={htmlContent}
            title="Incident Report"
            className="w-full h-[850px] border-0"
          />
        )}
      </div>
    </div>
  );
};
