// types/kakao.d.ts
declare global {
  interface Window {
    kakao: {
      maps: {
        Map: new (container: HTMLElement, options: any) => any
        LatLng: new (lat: number, lng: number) => any
        Marker: new (options: {
          map?: any
          position: any
          image?: any
          clickable?: boolean
          draggable?: boolean
          zIndex?: number
          title?: string
          opacity?: number
        }) => any
        MarkerImage: new (
          src: string,
          size: { width: number; height: number },
          options?: {
            alt?: string
            coords?: string
            offset?: { x: number; y: number }
            spriteOrigin?: { x: number; y: number }
            spriteSize?: { width: number; height: number }
            shape?: string
          },
        ) => any
        Size: new (width: number, height: number) => any
        InfoWindow: new (options: {
          content?: string
          disableAutoPan?: boolean
          map?: any
          position?: any
          removable?: boolean
          zIndex?: number
        }) => any
        event: {
          addListener: (target: any, type: string, handler: Function) => void
          removeListener?: (target: any, type: string, handler: (...args: any[]) => void) => void
        }
        services: {
          Geocoder: new () => {
            coord2Address: (lng: number, lat: number, callback: Function) => void
            addressSearch: (address: string, callback: Function) => void
          }
          Places: new () => {
            keywordSearch: (
              keyword: string,
              callback: (data: any[], status: string) => void,
              options?: {
                category_group_code?: string
                location?: any
                radius?: number
                sort?: string
                size?: number
                page?: number
              },
            ) => void
          }
          Status: {
            OK: string
            ZERO_RESULT: string
            ERROR: string
          }
        }
        load: (callback: Function) => void
      }
    }
  }
}