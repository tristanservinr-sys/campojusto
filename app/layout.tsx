import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'CampoJusto | Tu cosecha, mejores oportunidades',description:'Mercado agrícola inteligente para productores y compradores de México.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es-MX"><body>{children}</body></html>}
