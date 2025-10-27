import { QRCode } from "react-qrcode-logo";
import kairosLogo from "./../assets/logo-kairos.png";

function TuComponenteQR() {
  const url = "https://kairos.carscx.com";

  return (
    <div>
      <h3>Escanea para acceder a Kairos</h3>
      <QRCode
        value={url} // La URL a la que dirige
        logoImage={kairosLogo} // Tu logo importado
        logoWidth={80} // Ajusta el tamaño del logo
        logoHeight={80}
        eyeRadius={[
          {
            // top/left eye
            outer: [10, 10, 0, 10],
            inner: [0, 10, 10, 10]
          },
          [10, 10, 10, 0], // top/right eye
          [10, 0, 10, 10] // bottom/left
        ]} // Bordes redondeados en los ojos del QR
        size={400} // Tamaño total del QR
        fgColor="#2A0B59" // Color principal (usa un color oscuro de tu paleta)
        bgColor="#FFFFFF" // Color de fondo (blanco)
        qrStyle="fluid" // Estilo de los módulos
        logoOpacity={1}
        removeQrCodeBehindLogo={true} // ¡Importante! Esto "limpia" el área detrás del logo
      />
    </div>
  );
}

export default TuComponenteQR;
