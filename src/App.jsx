import { useState,useRef,useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';
// 起始点
const initialPosition = [35.6586, 139.7454];

// --- 新组件: 专门负责监听点击 ---
function ClickHandle({ onMapClick }) {
  useMapEvents({
    click(e) {
      // e.latlng 是用户点击的经纬度对象 { lat: ..., lng: ... }
      onMapClick(e.latlng);
    },
  });
  return null; // 这个组件不需要渲染任何东西，它只是个逻辑"幽灵"
}
// --- 新组件: 自动打开气泡的标记 ---
function AutoOpenMarker({position,children}){
  const markerRef = useRef(null);
  useEffect(() => {
    // 组件挂载，自动打开气泡
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  }, []); // 空数组表示只执行一次
  return (
    <Marker ref={markerRef} position={position}>
      {children}
    </Marker>
  )
}

function App() {
  // 3. 用一个数组来存储所有标记的位置
  const [markers, setMarkers] = useState([
    { lat: 35.6586, lng: 139.7454, text: '初始位置' },
  ]);
  // 添加新标记的函数
  const addNewMarker = async latlng => {
    // 1. 生成一个唯一 ID (用时间戳即可)
    const tempId = Date.now();
    // 2. 先创建一个"临时"标记，立即显示
    const tempMarker = {
      id: tempId, // 记下身份
      lat: latlng.lat,
      lng: latlng.lng,
      text: '正在获取地址... ⏳', // 用户马上能看到这个
    };
    // 立即更新 UI (先占座)
    setMarkers(current => [...current, tempMarker]);

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`;
      const response = await fetch(url);
      const data = await response.json();
      const address = data.display_name;

      setMarkers(current =>
        current.map(marker =>
          marker.id === tempId ? { ...marker, text: address } : marker
        )
      );
    } catch (error) {
      setMarkers(current =>
        current.map(marker =>
          marker.id === tempId ? { ...marker, text: '获取地址失败' } : marker
        )
      );
    }
  };
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <MapContainer center={initialPosition} zoom={13} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* 4. 使用我们要的点击监听组件 */}
        <ClickHandle onMapClick={addNewMarker} />
        {/* 5. 遍历数组，画出所有标记 */}
        {markers.map((markers, index) => (
          <AutoOpenMarker key={index} position={[markers.lat, markers.lng]}>
            <Popup>
              {markers.text}
              <br />
              坐标：{markers.lat.toFixed(4)},{markers.lng.toFixed(4)}
            </Popup>
          </AutoOpenMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;
