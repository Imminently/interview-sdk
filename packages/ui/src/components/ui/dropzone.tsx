// import { useCallback, useRef } from 'react';
// import { Trans } from 'react-i18next';
// import styled from 'styled-components';
// import { colors } from 'theme';

// const DropZone = styled.div`
//   border: 2px dashed #ccc;
//   border-radius: 1rem;
//   padding: 2rem;
//   text-align: center;
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   flex-direction: column;
//   height: 10rem;
//   width: 100%;
//   cursor: pointer;

//   &:hover {
//     background-color: #f5f5f5;
//   }

//   &.dragging {
//     border-color: ${p => p.theme.palette.primary.main};
//     background-color: ${colors.prayingMantis10};
//   }
// `;

// const DropZoneText = styled.p`
//   font-size: 1rem;
//   color: ${p => p.theme.palette.text.primary};
//   font-weight: 500;
// `;

// export const FileDropZone = ({ onLoad }) => {
//   const dropZoneRef = useRef<HTMLDivElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleDrop = useCallback((event) => {
//     event.preventDefault();
//     const files = event.dataTransfer.files;
//     if (files.length > 0) {
//       readFileAsText(files[0], onLoad);
//     }
//     dropZoneRef.current?.classList.remove('dragging'); // Remove dragging class
//   }, [onLoad]);

//   const handleDragOver = useCallback((event) => {
//     event.preventDefault();
//   }, []);

//   const handleDragEnter = useCallback((event) => {
//     event.preventDefault();
//     dropZoneRef.current?.classList.add('dragging'); // Add dragging class
//   }, []);

//   const handleDragLeave = useCallback((event) => {
//     event.preventDefault();
//     dropZoneRef.current?.classList.remove('dragging'); // Remove dragging class
//   }, []);

//   const handleClick = useCallback(() => {
//     fileInputRef.current?.click();
//   }, []);

//   const handleFileChange = useCallback((event) => {
//     const files = event.target.files;
//     if (files.length > 0) {
//       readFileAsText(files[0], onLoad);
//     }
//   }, [onLoad]);

//   const readFileAsText = (file, callback) => {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       if (e.target) callback(file.name, e.target.result);
//     };
//     reader.readAsText(file);
//   };

//   return (
//     <DropZone
//       ref={dropZoneRef}
//       onClick={handleClick}
//       onDrop={handleDrop}
//       onDragOver={handleDragOver}
//       onDragEnter={handleDragEnter}
//       onDragLeave={handleDragLeave}>
//       <DownloadIcon width="2rem" height="2rem" />
//       <DropZoneText><Trans i18nKey="json_drop_label"></Trans></DropZoneText>
//       <input
//         type="file"
//         ref={fileInputRef}
//         style={{ display: 'none' }}
//         accept="application/json"
//         onChange={handleFileChange}
//       />
//     </DropZone>
//   );
// };
