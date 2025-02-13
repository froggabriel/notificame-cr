import React from 'react';
import { Box, Button, CardContent, CardMedia, IconButton, Typography } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { RecommendationCard } from './StyledComponents';

const RecommendedProducts = ({
    displayedRecommendations,
    handlePrevRecommendations,
    handleNextRecommendations,
    recommendationStartIndex,
    RECOMMENDATIONS_PER_PAGE,
    recommendedProducts,
    addRecommendedProduct
}) => {
    return (
        <>
            <Typography variant="h6" component="h3" sx={{ width: '100%', textAlign: 'left', mb: 1 }}>
                Recommended Products
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', overflowX: 'auto', width: '100%', scrollBehavior: 'smooth' }}>
                <IconButton onClick={handlePrevRecommendations} disabled={recommendationStartIndex === 0}>
                    <ArrowBackIosIcon />
                </IconButton>
                <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 2, width: '100%', overflow: 'hidden' }}>
                    {displayedRecommendations.map(product => (
                        <RecommendationCard key={product.productID} sx={{ width: 200, flexShrink: 0 }} available={product.availableAnywhere.toString()}>
                            <CardMedia
                                component="img"
                                height="140"
                                image={product.imageUrl}
                                alt={product.ecomDescription}
                                sx={{ objectFit: 'contain', p: 1 }}
                            />
                            <CardContent>
                                <Typography variant="subtitle1" component="div">
                                    {product.ecomDescription}
                                </Typography>
                            </CardContent>
                            <Box sx={{ p: 1 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => addRecommendedProduct(product.productID)}
                                >
                                    Add to List
                                </Button>
                            </Box>
                        </RecommendationCard>
                    ))}
                </Box>
                <IconButton onClick={handleNextRecommendations} disabled={recommendationStartIndex + RECOMMENDATIONS_PER_PAGE >= recommendedProducts.length}>
                    <ArrowForwardIosIcon />
                </IconButton>
            </Box>
        </>
    );
};

export default RecommendedProducts;
