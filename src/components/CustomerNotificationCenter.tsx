import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, Coffee, Cake, Gift, ShieldCheck } from 'lucide-react';
import { AppNotification, UserSession } from '../types';

interface CustomerNotificationCenterProps {
  session: UserSession;
  notifications: AppNotification[];
}

export default function CustomerNotificationCenter({ session, notifications }: CustomerNotificationCenterProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Las notificaciones del sistema no son compatibles con este navegador celular.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermissionStatus(result);
    if (result === 'granted') {
      try {
        new Notification('¡Notificaciones Activas! ☕', {
          body: 'Ahora recibirás alertas directas del Bistro Mi Cafecito.',
        });
      } catch (e) {
        console.log('Fired initial verification but got restricted');
      }
    }
  };

  // Filter notifications that match "all" or specific customer folio
  const myNotifications = notifications.filter(
    n => n.targetCustomerFolio === 'all' || n.targetCustomerFolio === session.folio
  );

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 font-sans text-left">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <span className="p-1.5 bg-[#2bbba9]/10 text-[#2bbba9] rounded-xl flex items-center justify-center shrink-0">
          <Bell size={16} />
        </span>
        <div>
          <h4 className="font-serif font-black text-slate-900 text-xs uppercase tracking-wider">Centro de Notificaciones</h4>
          <p className="text-[10px] text-slate-400">Avisos y promociones en tiempo real para ti</p>
        </div>
      </div>

      {/* Permission Safeguard Opt-In */}
      {permissionStatus !== 'granted' ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#2bbba9] block">📱 Alertas en tu celular</span>
            <p className="text-[11px] text-slate-500 leading-normal">
              Habilita los avisos para recibir notificaciones directamente en tu pantalla de bloqueo sobre promociones al 2x1 y regalos de cumpleaños.
            </p>
          </div>
          <button
            onClick={requestPermission}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Bell size={13} />
            Habilitar en mi celular
          </button>
        </div>
      ) : (
        <div className="bg-teal-50/50 border border-teal-150 rounded-2xl p-3 flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#2bbba9]" />
          <span className="text-[10.5px] text-teal-800 font-medium">
            Alertas de sistema activas ✔ (Aparecen en tu barra de notificaciones)
          </span>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
        {myNotifications.length === 0 ? (
          <div className="text-center py-6 text-slate-400 space-y-1 select-none">
            <p className="text-xs font-medium">No hay avisos recientes</p>
            <p className="text-[10px] text-slate-400">Aquí aparecerán tus alertas y sorpresas de Mi Cafecito.</p>
          </div>
        ) : (
          myNotifications.map((noti) => (
            <div
              key={noti.id}
              className="p-3 bg-slate-50 hover:bg-slate-100/75 border border-slate-150 rounded-2xl flex gap-3 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#2bbba9] flex items-center justify-center shrink-0 shadow-sm">
                {noti.icon === 'coffee' && <Coffee size={15} />}
                {noti.icon === 'promo' && <Sparkles size={15} />}
                {noti.icon === 'cake' && <Cake size={15} />}
                {noti.icon === 'gift' && <Gift size={15} />}
                {noti.icon === 'alert' && <Bell size={15} />}
              </div>
              <div className="flex-grow space-y-0.5 text-left min-w-0">
                <div className="flex items-center justify-between gap-2.5">
                  <h5 className="text-[11.5px] font-bold text-slate-900 truncate leading-tight">{noti.title}</h5>
                  <span className="text-[8px] text-slate-400 font-mono shrink-0">
                    {new Date(noti.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-normal">{noti.body}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
