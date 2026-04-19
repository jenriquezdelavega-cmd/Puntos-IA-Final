'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ActionLink } from './action-link';
import { pricingContent } from '@/src/content/pricing-content';

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[#faf8fc] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        
        <div className="mx-auto max-w-3xl mb-16">
          <h2 className="text-4xl font-black tracking-tight text-[#241548] sm:text-5xl">
            {pricingContent.title}
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#583e86]">
            {pricingContent.description}
          </p>
          <div className="mt-4 animate-bounce">
            <span className="inline-block rounded-full bg-[#fde8eb] px-4 py-1.5 text-sm font-bold text-[#e11d48]">
              {pricingContent.trialCallout}
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="mt-10 mb-16 flex justify-center">
          <div className="relative flex items-center rounded-full bg-white p-1 ring-1 ring-[#eadcf8]">
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative w-32 rounded-full py-2 text-sm font-semibold transition-colors duration-200 ${!isAnnual ? 'text-white' : 'text-[#583e86]'}`}
            >
              {!isAnnual && <motion.div layoutId="pill" className="absolute inset-0 rounded-full bg-[#7e4fd3]" />}
              <span className="relative z-10">Mensual</span>
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative w-32 rounded-full py-2 text-sm font-semibold transition-colors duration-200 ${isAnnual ? 'text-white' : 'text-[#583e86]'}`}
            >
              {isAnnual && <motion.div layoutId="pill" className="absolute inset-0 rounded-full bg-[#7e4fd3]" />}
              <span className="relative z-10">Anual <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-1">-20%</span></span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 sm:gap-6 lg:gap-8 max-w-md mx-auto lg:max-w-7xl">
          {pricingContent.tiers.map((tier) => (
            <div 
              key={tier.name}
              className={`relative flex flex-col justify-between rounded-3xl p-8 xl:p-10 transition-all duration-300 ${
                tier.highlight 
                ? 'bg-[#160b2b] text-white ring-4 ring-[#7e4fd3] shadow-2xl scale-100 lg:scale-110 z-10' 
                : 'bg-white ring-1 ring-[#eadcf8] mt-0 lg:mt-8'
              }`}
            >
              {tier.badge && (
                <div className="absolute top-0 right-6 -translate-y-1/2">
                  <span className="inline-block rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-pink-500/30">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div>
                <h3 className={`text-xl font-bold ${tier.highlight ? 'text-white' : 'text-[#241548]'}`}>{tier.name}</h3>
                <p className={`mt-4 text-sm leading-6 ${tier.highlight ? 'text-[#a593c2]' : 'text-gray-600'}`}>
                  {tier.description}
                </p>
                <div className="mt-8 flex items-baseline gap-x-1">
                  <span className={`text-4xl font-black tracking-tight ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {isAnnual ? tier.price.annual : tier.price.monthly}
                  </span>
                  {tier.price.monthly !== 'A medida' && (
                    <span className={`text-sm font-semibold leading-6 ${tier.highlight ? 'text-gray-300' : 'text-gray-600'}`}>/mes</span>
                  )}
                </div>

                <ul className={`mt-8 space-y-3 text-sm leading-6 ${tier.highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className={`h-6 w-5 flex-none ${tier.highlight ? 'text-[#ff5e91]' : 'text-[#7e4fd3]'}`} aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <ActionLink 
                  href={tier.href} 
                  className={`w-full text-center py-3 px-6 rounded-xl font-semibold transition ${
                    tier.highlight 
                    ? 'bg-[#7e4fd3] text-white hover:bg-[#6c40bb] shadow-lg shadow-purple-500/25' 
                    : 'bg-[#f5edff] text-[#583e86] hover:bg-[#eadcf8]'
                  }`}
                >
                  {tier.cta}
                </ActionLink>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mx-auto max-w-4xl mt-32 text-left">
          <h2 className="text-3xl font-black tracking-tight text-[#241548] text-center mb-12">Preguntas Frecuentes</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl ring-1 ring-[#eadcf8]">
              <h4 className="text-lg font-bold text-[#241548] mb-2">¿Cómo funcionan los 15 días gratis?</h4>
              <p className="text-gray-600 text-sm">Al registrarte obtienes acceso completo a todas las funciones del plan Pro. Si decides no continuar, se cancela sin cobros. No necesitas tarjeta de crédito para iniciar la prueba.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl ring-1 ring-[#eadcf8]">
              <h4 className="text-lg font-bold text-[#241548] mb-2">¿Mis clientes deben descargar algo?</h4>
              <p className="text-gray-600 text-sm">No. Tu programa funciona sobre Apple Wallet (nativo en iPhone) y Google Wallet (nativo en Android). Nunca más les pedirás descargar &quot;tu app&quot;.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl ring-1 ring-[#eadcf8]">
              <h4 className="text-lg font-bold text-[#241548] mb-2">¿Qué necesito para leer los pases?</h4>
              <p className="text-gray-600 text-sm">Cualquier celular o tablet con cámara e internet. No requieres tótems caros, ni escaners infrarrojos. Inicias sesión en puntoia.mx y escaneas, así de simple.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl ring-1 ring-[#eadcf8]">
              <h4 className="text-lg font-bold text-[#241548] mb-2">¿Puedo cancelar o cambiar de plan?</h4>
              <p className="text-gray-600 text-sm">Sí, sin letras chiquitas ni plazos forzosos. Puedes cambiar entre planes o cancelar tu suscripción desde tu panel de administrador con 2 clics.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
