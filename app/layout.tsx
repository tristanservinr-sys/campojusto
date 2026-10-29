import type { Metadata } from 'next';
import './globals.css';
import VoiceAgent from '@/components/campojusto/voice-agent';
export const metadata:Metadata={title:'CHAPINGENIEROS | Tu cosecha, mejores oportunidades',description:'Mercado agrícola inteligente para productores y compradores de México.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es-MX"><body>{children}<VoiceAgent/></body></html>}
