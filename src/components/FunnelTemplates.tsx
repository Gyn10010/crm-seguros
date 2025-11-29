import React from 'react';
import FunnelStageActivities from './FunnelStageActivities';

interface FunnelTemplatesProps {
  ldrState: any;
}

const FunnelTemplates: React.FC<FunnelTemplatesProps> = () => {
  return <FunnelStageActivities />;
};

export default FunnelTemplates;