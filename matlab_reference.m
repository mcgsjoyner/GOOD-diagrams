% This script provided by Aaron Master, February 2024

% Let's make some good diagrams
% Start with basic shape, then automate making rows etc

%% OPTIONALLY IGNORE THIS SECTION.  It specifies each layer manually for an example plot in figure 5.
if 0
   hFig=figure(5); clf; hold on; axis([-1.5 15 -4.5 6])
   %color = get(hFig,'Color');
   %set(gca,'XColor',color,'YColor',color,'TickDir','out')
   axis off
   [Lprev,px] = draw_input(         2,-2);
   [Lprev,px] = draw_layer(Lprev,px,3,0  ,'R', 1 , 1);
   [Lprev,px] = draw_layer(Lprev,px,5,2.5,'R', 2 , 1);
   [Lprev,px] = draw_layer(Lprev,px,9,6,'R', 3 , 1);
   [Lprev,px] = draw_layer(Lprev,px,5,9.5  ,'R', 4 , 1);
   [Lprev,px] = draw_layer(Lprev,px,3,12.5  ,'R', 5 , 1);
   [Lprev,px] = draw_layer(Lprev,px,1,14  ,'S', 6 , 1);
end
%% PROBABLY START HERE.  This section is where the user sets parameters of the network that will be drawn automatically.
% (In the future I'd make this a structure for inputs.)
% 1) The input dimensionality (how many nodes)
inputDims = 2;
% 2) number of nodes per layer for each subsequent layer
nodesPerLayer       = [ 6 , 10,  7,  5,  9,  1]; % NOTE glitch in Matlab means it shows node subscripts wrong if they're two digits so max 9 for now
% 3) The activation "letters" shown lower right corner in each node
activationsPerLayer = {'R','R', 'R','R','R','\sigma'}; % NOTE make this optional and default to showing nothing if not specified
% 4) optionally, whether we include bias at every layer (default: yes)
% And from that, we automate (1) spacing on x axis (2) axes limits
biasFlagsPerLayer = ones(1,length(nodesPerLayer)); % NOTE make this optional default to always including bias
% 5) optionally, the figure number
figureNumber = 1;   % allow user to specify Matlab window figure number
% TODO: automate displaying the "activation letter" nicely if it is 2
% (or more?) characters long; right now it overflows
%% MAIN SCRIPT WHICH CALLS OTHER FUNCTIONS TO DRAW THE DIAGRAM
% To get x range:
% Assume spacing of 3.5 units between layers (update that later)
% Assume that x starts negative by the default spacing
% To get y range:
% Assume this is set by tallest (most nodes) layer.  Divide that number by
% two.  Subtract 1 for y max, add 2.5 for y min
Nlayers = length(nodesPerLayer);
maxNodesInOneLayer = max(nodesPerLayer);
baselineSpacing = 3.5; %2.5; % OK, so only issue with fixing it at this is that the BIAS arrows can cross some nodes... so look into that
%layerSpacing = 3.5*ones(1,Nlayers);
layerSpacing = zeros(1,Nlayers);
%layerSpacing(1) = 0.25*nodesPerLayer(1)/inputDims+baselineSpacing;
layerSpacing(1) = baselineSpacing;% + 0.4*nodesPerLayer(1) - 0.4*(nodesPerLayer(1)/inputDims);
for nthLayer = 2:Nlayers
   %layerSpacing(nthLayer) = 0.25*nodesPerLayer(nthLayer)/nodesPerLayer(nthLayer-1) + baselineSpacing;
   layerSpacing(nthLayer) = baselineSpacing;% + 0.4*nodesPerLayer(nthLayer) - 0.4*(nodesPerLayer(nthLayer)/nodesPerLayer(nthLayer-1));
   %layerSpacing(nthLayer) = baselineSpacing + 0.4*max([nodesPerLayer(nthLayer),nodesPerLayer(nthLayer-1)]);
end
hFig=figure(figureNumber); clf; hold on;
axis([0  (sum(layerSpacing)+mean(layerSpacing)*0.5)  -maxNodesInOneLayer/2 maxNodesInOneLayer/2+1])
axis off
[Lprev,px] = draw_input(inputDims,0);
for nthLayer = 1:Nlayers
   [Lprev,px] = draw_layer(Lprev,px,nodesPerLayer(nthLayer),sum(layerSpacing(1:nthLayer)) ,char(activationsPerLayer(nthLayer)),nthLayer,biasFlagsPerLayer(nthLayer));
end
% [Lprev,px] = draw_layer(Lprev,px,3,0  ,'R', 1 , 1);
% [Lprev,px] = draw_layer(Lprev,px,5,2.5,'R', 2 , 1);
% [Lprev,px] = draw_layer(Lprev,px,9,6,'R', 3 , 1);
% [Lprev,px] = draw_layer(Lprev,px,5,9.5  ,'R', 4 , 1);
% [Lprev,px] = draw_layer(Lprev,px,3,12.5  ,'R', 5 , 1);
% [Lprev,px] = draw_layer(Lprev,px,1,14  ,'S', 6 , 1);
%%  FUNCTION TO DRAW THE INPUT LAYER AND CREATE HOOKS TO IT
function [Lprev,px] = draw_input(L,cx)
   w = 0.85;
   h = 0.65;
   l = L;
   for cy =  -L/2+1:L/2
           plot([cx+w/2, cx+w],[cy,cy],'k')
           text(cx+w/2, cy+h/2,['\fontname{Times}\itx_',num2str(l)])
           l = l-1;
   end
   Lprev = L;
   px = cx+w;
end
%%  FUNCTION TO DRAW A LAYER CONNECTED TO THE PREVIOUS LAYER
function [Lprev,px] = draw_layer(Lprev,px,L,cx,activation,nthLayer,biasFlag)
   if nargin < 6
       biasFlag = 1;
   end
   w = 0.85; % width
   h = 0.65; % height
   l = L;
   for cy =  -L/2+1:L/2
           myobj = good_node(w,h,cx,cy);
           plot(myobj,'FaceColor','none');
           plot([cx+w/2, cx+1.3*w],[cy,cy],'k') % draw line activation label goes on top of
           text(cx+w/2, cy+h/2,['\fontname{Times} a_{',num2str(l),'}^[^{',num2str(nthLayer),'}^]'])
           l = l-1;
           text(cx+w/8,cy-h/4,['\it{\fontname{Script MT Bold}',activation,'}'],'FontSize',8)
           % Show connections from previous layer and for bias
           for py = -Lprev/2:Lprev/2 % previous y
               if py == -Lprev/2 % bias
                   if biasFlag==1
                       my_x = .7*px+.3*cx;
                       my_y = min(-Lprev/2+.4,mean([-Lprev/2+.4,-L/2+1]));% lower of (1) previous layer -L/2 or (2) average of -Lprev/2 and -L/2
                       %[xx,yy] = datc2figc([px+.9*w, cx-w/2*cos(atan((py-cy)/(px-cx)))],...
                       %                    [py+h/2, cy-h/2*sin(atan((py-cy)/(px-cx)))]);
                       [xx,yy] = datc2figc([my_x, cx-w/2*cos(atan((py-cy)/(px-cx)))],...
                                           [my_y, cy-h/2*sin(atan((py-cy)/(px-cx)))]);
                       annotation("arrow",xx,yy,'HeadStyle','plain','LineWidth',0.5,'HeadLength',7,'HeadWidth',5)
                       if py==-Lprev/2
                           % place "1" on a line for arrows entering layer
                           %plot([px+.6*w, px+.9*w],[py+h/2,py+h/2],'k')
                           %myheight =
                           plot([my_x-.3*w, my_x],[my_y,my_y],'k')

                           %text(px+0.6*w,py+.7*h,'\fontname{Cambria Math}1')
                           text(my_x-.3*w,my_y+h/4,'\fontname{Cambria Math}1')
                       end
                   end
               else % regular node
                   [xx,yy] = datc2figc([px, cx-w/2*cos(atan((py-cy)/(px-cx)))],...
                                       [py, cy-h/2*sin(atan((py-cy)/(px-cx)))]);
                   annotation("arrow",xx,yy,'HeadStyle','plain','LineWidth',0.5,'HeadLength',7,'HeadWidth',5)
               end
           end
  end
  Lprev = L;
  px = cx+1.3*w;
end
%% FUNCTION TO JUST DRAW THE "D"-SHAPED NODE FOR GOOD DIAGRAMS
function myobj = good_node(w,h,cx,cy)
   %x = 0.5*w*[cos(pi/2:pi/50:3*pi/2)'; 0; 1; 1; 0]+cx;
   %y = 0.5*h*[sin(pi/2:pi/50:3*pi/2)';-1;-1; 1; 1]+cy;
   x = 0.5*w*[cos(pi/2:pi/50:3*pi/2)'; 1; 1]+cx;
   y = 0.5*h*[sin(pi/2:pi/50:3*pi/2)';-1; 1]+cy;
   myobj = polyshape([x,y]);
end
%% Example usage of datc2figc
%
% clf
% x = 0:180; f = 0.09*exp(-x/18);
% plot(x, f);
% [xx, yy] = datc2figc([50 20],[f(20) f(20)]);
% annotation('arrow',xx,yy,'HeadStyle','plain','LineWidth',2);
function varargout = datc2figc(varargin)
% NOTE THIS FUNCTION IS COPIED FROM
% https://www.mathworks.com/matlabcentral/answers/310815-specify-annotation-position-with-respect-to-x-and-y-axes-values
% CONTRIBUTED BY USER "DGM" ON 15 AUG 2021
% FIGCOORDINATES = DATC2FIGC({HAX},DATACOORDINATES)
% try to convert dataspace coordinates to figure coordinates
%
% HAX is an axes handle (optional; default is gca)
% DATACOORDINATES may be presented one of two ways:
%   DATC2FIGC({HAX},POSITION) -- as a 4-element vector [x0 y0 width height]
%   DATC2FIGC({HAX},X,Y) -- as simple X, Y vectors
%
% FIGCOORDINATES has the same form as DATACOORDINATES
%
% to my knowledge, this used to be an example
% accordingly, there is no documentation
if length(varargin{1}) == 1 && ishandle(varargin{1}) ...
                           && strcmp(get(varargin{1},'type'),'axes')
   hAx = varargin{1};
   varargin = varargin(2:end);
else
   hAx = gca;
end
if length(varargin) == 1
   pos = varargin{1};
else
   [x,y] = deal(varargin{:});
end
axun = get(hAx,'Units');
set(hAx,'Units','normalized');
axpos = get(hAx,'Position');
axlim = axis(hAx);
axwidth = diff(axlim(1:2));
axheight = diff(axlim(3:4));
if exist('x','var')
   varargout{1} = (x - axlim(1)) * axpos(3) / axwidth + axpos(1);
   varargout{2} = (y - axlim(3)) * axpos(4) / axheight + axpos(2);
else
   pos(1) = (pos(1) - axlim(1)) / axwidth * axpos(3) + axpos(1);
   pos(2) = (pos(2) - axlim(3)) / axheight * axpos(4) + axpos(2);
   pos(3) = pos(3) * axpos(3) / axwidth;
   pos(4) = pos(4) * axpos(4 )/ axheight;
   varargout{1} = pos;
end
set(hAx,'Units',axun)
end
