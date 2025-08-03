// src/components/MyDialog.jsx
import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import './Subjects.css';


function MyDialog({ open, onClose, onConfirm, title, message }) {
    return (
        <Dialog
            className="Topic-Learn-Dialog"
            open={open}
            onClose={() => onClose()} // Allow closing by clicking outside
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
        >
            <DialogTitle id="dialog-title">{title}</DialogTitle>
            <DialogContent>
                <Typography id="dialog-description">{message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose()}>No Thanks</Button>
                <Button onClick={() => onConfirm()} autoFocus>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default MyDialog;