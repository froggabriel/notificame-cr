import { styled } from '@mui/material/styles';
import { MenuItem, Button, alpha, Card, Box } from '@mui/material';

export const StyledMenuItem = styled(MenuItem)(({ theme, available }) => ({
    ...(available === 'false' && {
        color: theme.palette.text.disabled,
        '& .MuiAvatar-root': {
            filter: 'grayscale(100%)',
        },
    }),
}));

export const ElegantButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    borderColor: alpha(theme.palette.text.secondary, 0.5),
    "&:hover": {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        borderColor: theme.palette.primary.main,
        color: theme.palette.primary.main,
    },
}));

export const RecommendationCard = styled(Card)(({ theme, available }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    ...(available === 'false' && {
        backgroundColor: alpha(theme.palette.background.default, 0.5),
        color: theme.palette.text.disabled,
        '& .MuiCardMedia-root': {
            filter: 'grayscale(100%)',
        },
    }),
}));

export const JsonButton = styled(Button)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.primary.main, 0.7),
    color: theme.palette.common.white,
    padding: theme.spacing(0.5, 1),
    minWidth: 0,
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.75rem',
    fontWeight: theme.typography.fontWeightMedium,
    width: '100%', // Full width of the container
    boxSizing: 'border-box', // Include padding and border in the element's total width and height
    '&:hover': {
        backgroundColor: theme.palette.primary.main,
    },
    '@media (max-width: 600px)': {
        '.button-text': {
            display: 'none',
        },
    },
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1), // Spacing between buttons
    width: 'max-content', // Width based on content
    maxWidth: '200px', // Prevent content from becoming too wide
    marginTop: theme.spacing(2), // Add margin to avoid overlapping with text
}));
