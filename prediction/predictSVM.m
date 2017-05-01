clear
clc
close all

%% Global variables
% 
% load dataset
fea = csvread('fea.csv');
gnd = csvread('gnd.csv');
gnd = gnd';
numTrain = 190;
trainFea = fea(1:numTrain,:);
trainLabel = gnd(1:numTrain,:);

testFea = fea(numTrain + 1:380,:);
testLabel = gnd(numTrain + 1:380,:);

[nFea, n] = size(trainFea);

cross_validation = ' -v 5 ';

% slack C
C = [5, 10, 15, 20];
% gamma
gamma = [0.001, 0.01, 0.1, 1, 10];
% 

%% Linear kernel
% options = '-t 0 -c ';
% model = zeros(4);
% 
% for i=C
%     subOptions = [options, num2str(i), fold];
%     model(i,:) = svmtrain(trainLabel, trainFea, subOptions);
%     clear subOptions;
% end
% 
% % get highest accuracy
% [maxValue, maxIndex] = max(model);
% options = [options, num2str(maxIndex), fold];
% 
% % construct linear model 
% linearModel = svmtrain(trainLabel, trainFea, options);
% % predict using LIBSVM
% [predictLabel] = svmpredict(testLabel, testFea, linearModel);
%

%% Polynomial kernel
% options = '-t 1';
% degree = [3, 4, 5, 6];
% model = [];
% for i=gamma
%     subGamma = [' -g ', num2str(i)];
%     subGammaOptions = [options, fold, subGamma];
%     for j=degree
%         subDegree = [' -d ', num2str(j)];
%         subDegreeOptions = [subGammaOptions, subDegree];
%         subModel = svmtrain(trainLabel, trainFea, subDegreeOptions);
%         model = [model, vertcat(subModel, i, j)];
%     end
% end
% [maxValue, maxIndex] = max(model(1,:));
% options = [options, ' -g ', num2str(model(2,maxIndex)), ' -d ', num2str(model(3,maxIndex))];
% 
% % construct polynomial model 
% polynomialModel = svmtrain(trainLabel, trainFea, options);
% % predict using LIBSVM
% [predictLabel] = svmpredict(testLabel, testFea, polynomialModel);
% 

%% Gaussion kernel
options = '-t 2';
model = [];
for i=gamma
    subGamma = [' -g ', num2str(i)];
    subGammaOptions = [options, cross_validation, subGamma];
    for j=C
        subC = [' -c ', num2str(j)];
        subDegreeOptions = [subGammaOptions, subC];
        subModel = svmtrain(trainLabel, trainFea, subDegreeOptions);
        model = [model, vertcat(subModel, i, j)];
    end
end
[maxValue, maxIndex] = max(model(1,:));
options = [options, ' -g ', num2str(model(2,maxIndex)), ' -c ', num2str(model(3,maxIndex))];

% construct Gaussian model 
gaussionModel = svmtrain(trainLabel, trainFea, options);
% predict using LIBSVM
[predictLabel] = svmpredict(testLabel, testFea, gaussionModel);
%
