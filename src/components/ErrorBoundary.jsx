import { Component } from 'react' 
 
 export default class ErrorBoundary 
   extends Component { 
   constructor(props) { 
     super(props) 
     this.state = { hasError: false, error: null } 
   } 
 
   static getDerivedStateFromError(error) { 
     return { hasError: true, error } 
   } 
 
   componentDidCatch(error, info) { 
     console.error('Page error:', error, info) 
   } 
 
   render() { 
     if (this.state.hasError) { 
       return ( 
         <div style={{ 
           minHeight: '100vh', 
           background: 'var(--bg-primary)', 
           display: 'flex', 
           alignItems: 'center', 
           justifyContent: 'center', 
           flexDirection: 'column', 
           gap: '16px', 
           padding: '24px', 
           paddingTop: '80px', 
         }}> 
           <div style={{ fontSize: '48px' }}>⚠️</div> 
           <h2 style={{ 
             color: 'var(--text-primary)', 
             fontSize: '20px', 
             fontWeight: '700', 
           }}> 
             Something went wrong 
           </h2> 
           <p style={{ 
             color: 'var(--text-secondary)', 
             fontSize: '14px', 
             textAlign: 'center', 
             maxWidth: '400px', 
           }}> 
             {this.state.error?.message || 
               'An unexpected error occurred'} 
           </p> 
           <button 
             onClick={() => window.location.href = '/'} 
             style={{ 
               padding: '10px 24px', 
               background: '#0F6E56', 
               color: 'var(--text-primary)', 
               border: 'none', 
               borderRadius: '8px', 
               cursor: 'pointer', 
               fontWeight: '600', 
             }} 
           > 
             Go Home 
           </button> 
           <button 
             onClick={() => window.location.reload()} 
             style={{ 
               padding: '10px 24px', 
               background: 'transparent', 
               color: 'var(--text-secondary)', 
               border: '1px solid var(--border)', 
               borderRadius: '8px', 
               cursor: 'pointer', 
             }} 
           > 
             Try Again 
           </button> 
         </div> 
       ) 
     } 
     return this.props.children 
   } 
 } 
